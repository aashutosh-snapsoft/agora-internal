import {
	ApolloClient,
	HttpLink,
	InMemoryCache,
	ApolloLink,
	split,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import fetchPonyfill from "cross-fetch";
import { isGraphqlSchemaError } from "@/lib/hard-reset";
import { getAppHealthController } from "@/lib/health-controller";

type HasuraServiceProps = {
	getAccessToken: () => Promise<string>;
	logout: () => void;
	role: string;
};

type HasuraAdminProps = {
	adminSecret: string;
};

/**
 * Create WebSocket link for GraphQL subscriptions
 *
 * Uses graphql-ws protocol (recommended by Hasura)
 * Authentication via session cookie (automatically sent by browser)
 *
 * @param wsUrl - WebSocket URL (wss://hasura.example.com/v1/graphql)
 */
function createWsLink(wsUrl: string): GraphQLWsLink {
	// Only create in browser context
	if (typeof window === "undefined") {
		// Return a dummy link for SSR - subscriptions won't work server-side
		// This prevents "WebSocket is not defined" errors during SSR
		throw new Error("WebSocket link cannot be created server-side");
	}

	const client = createClient({
		url: wsUrl,

		// Connection parameters - empty because auth is via cookie
		// Hasura will call auth webhook with forwarded cookies
		connectionParams: () => ({}),

		// Reconnection configuration
		retryAttempts: Infinity, // Keep trying
		shouldRetry: () => true, // Always retry

		// Reconnection timing with exponential backoff
		retryWait: async (retries) => {
			// Exponential backoff: 1s, 2s, 4s, 8s, ... up to 30s
			const delay = Math.min(1000 * Math.pow(2, retries), 30000);
			await new Promise((resolve) => setTimeout(resolve, delay));
		},

		// Connection lifecycle hooks for debugging
		on: {
			connected: () => {
				console.log("[hasura-ws] Connected to Hasura WebSocket");
			},
			closed: (event: unknown) => {
				const closeEvent = event as { code?: number; reason?: string };
				console.log("[hasura-ws] Connection closed", {
					code: closeEvent?.code,
					reason: closeEvent?.reason,
				});
			},
			error: (error) => {
				console.error("[hasura-ws] Connection error:", error);
			},
			connecting: () => {
				console.log("[hasura-ws] Connecting to Hasura WebSocket...");
			},
		},

		// Lazy connection - only connect when subscription starts
		lazy: true,

		// Keep connection alive with pings
		keepAlive: 10000, // Ping every 10 seconds
	});

	return new GraphQLWsLink(client);
}

/**
 * Check if operation is a subscription
 */
function isSubscriptionOperation(query: any): boolean {
	const definition = getMainDefinition(query);
	return (
		definition.kind === "OperationDefinition" &&
		definition.operation === "subscription"
	);
}

/**
 * Create split link for Apollo Client
 *
 * Routes operations based on type:
 * - Subscriptions -> WebSocket (direct to Hasura, cookie auth)
 * - Queries/Mutations -> HTTP (via BFF proxy)
 *
 * @param httpLink - HTTP link for queries/mutations
 * @param wsUrl - WebSocket URL for subscriptions
 */
function createSplitLink(
	httpLink: ApolloLink,
	wsUrl: string | undefined
): ApolloLink {
	// If no WebSocket URL configured, use HTTP only
	if (!wsUrl) {
		console.warn(
			"[hasura-service] No WebSocket URL configured, subscriptions disabled"
		);
		return httpLink;
	}

	// In server-side context, use HTTP only (no WebSocket in Node.js)
	if (typeof window === "undefined") {
		return httpLink;
	}

	// Create WebSocket link
	const wsLink = createWsLink(wsUrl);

	// Split based on operation type
	return split(
		({ query }) => isSubscriptionOperation(query),
		wsLink, // true -> subscription -> WebSocket
		httpLink // false -> query/mutation -> HTTP
	);
}

export class HasuraService {
	private client: ApolloClient<any>;
	private authType: "bearer" | "admin";

	setDispatchAndAuthContext(
		_dispatch: any,
		_authContext: any | null = null
	) {
		// No-op: kept for backward compatibility
	}

	static createWithBearer(_props: HasuraServiceProps) {
		return new HasuraService("bearer");
	}

	static createWithAdmin(props: HasuraAdminProps) {
		return new HasuraService("admin", props);
	}

	constructor(
		authType: "bearer" | "admin",
		private props?: HasuraAdminProps
	) {
		this.authType = authType;
		this.client = this.createClient();
	}

	private createClient() {
		const runtimeFetch =
			typeof globalThis.fetch === "function"
				? globalThis.fetch.bind(globalThis)
				: fetchPonyfill;

		// For bearer auth, use BFF proxy for HTTP (no client-side JWTs)
		// For admin auth, connect directly to Hasura (server-side only)
		const hasuraUrl =
			process.env.HASURA_GRAPHQL_URL || process.env.HASURA_ENDPOINT;
		const hasuraWsUrl = process.env.NEXT_PUBLIC_HASURA_WS_URL;

		if (this.authType === "admin" && !hasuraUrl) {
			throw new Error(
				"Hasura admin client misconfigured: missing HASURA_GRAPHQL_URL/HASURA_ENDPOINT"
			);
		}

		const uri = this.authType === "bearer" ? "/api/hasura" : hasuraUrl || "";

		const httpLink = new HttpLink({
			uri,
			fetch: runtimeFetch,
			// Include credentials for session-based auth
			credentials: this.authType === "bearer" ? "include" : "omit",
		});

		// For admin auth, add admin secret header via ApolloLink
		let link: ApolloLink = httpLink;
		const errorLink = onError(({ graphQLErrors }) => {
			if (typeof window === "undefined" || !graphQLErrors?.length) return;
			const healthController = getAppHealthController();
			for (const error of graphQLErrors) {
				if (isGraphqlSchemaError(error.message)) {
					healthController.reportSchemaMismatch("graphql-schema");
					return;
				}
			}
		});
		if (this.authType === "admin" && this.props) {
			const adminProps = this.props as HasuraAdminProps;
			const adminLink = new ApolloLink((operation, forward) => {
				operation.setContext({
					headers: {
						"x-hasura-admin-secret": adminProps.adminSecret,
					},
				});
				return forward(operation);
			});
			link = ApolloLink.from([errorLink, adminLink, httpLink]);
			// Admin mode: no WebSocket needed (server-side only)
		} else if (this.authType === "bearer") {
			// Bearer mode: use split link for subscriptions
			// WebSocket auth is via session cookie (handled by Hasura webhook)
			link = ApolloLink.from([errorLink, createSplitLink(httpLink, hasuraWsUrl)]);
		}

		return new ApolloClient({
			link,
			cache: new InMemoryCache({}),
			defaultOptions: {
				query: {
					fetchPolicy: "cache-first",
				},
				mutate: {
					fetchPolicy: "no-cache",
				},
				watchQuery: {
					fetchPolicy: "cache-and-network",
				},
			},
		});
	}

	getClient() {
		return this.client;
	}
}
