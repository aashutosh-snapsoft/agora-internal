import { AppConfig } from "./types/config";

// Debug environment variables

export const config: AppConfig = {
	url: process.env.NEXT_PUBLIC_URL ?? "",
	logos_url: process.env.NEXT_PUBLIC_LOGOS_URL ?? "",
	graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "",
	auth0: {
		domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN ?? "",
		clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID ?? "",
		audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE ?? "",
	},
	gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
	amplitudeApiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? "",
	buildId:
		process.env.NEXT_PUBLIC_BUILD_ID ??
		process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
		"",
};

/**
 * Server-side Auth0 configuration for Next.js SDK
 * These are server-only environment variables (not prefixed with NEXT_PUBLIC_)
 */
export const auth0ServerConfig = {
	secret: process.env.AUTH0_SECRET ?? "",
	baseURL: process.env.AUTH0_BASE_URL ?? "",
	issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL ?? "",
	clientID: process.env.AUTH0_CLIENT_ID ?? "",
	clientSecret: process.env.AUTH0_CLIENT_SECRET ?? "",
	audience: process.env.AUTH0_AUDIENCE ?? "",
};
