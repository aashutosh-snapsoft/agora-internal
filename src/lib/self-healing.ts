import { getAppHealthController } from "@/lib/health-controller";
import { isNetworkError, classifyAuthError } from "@/lib/error-classification";

let fetchInterceptorInstalled = false;
const resolveRequestUrl = (input: RequestInfo | URL): string => {
	if (typeof input === "string") return input;
	if (input instanceof URL) return input.toString();
	if (input instanceof Request) return input.url;
	return String(input);
};

const isAuthEndpoint = (url: string): boolean => {
	try {
		const resolved = url.startsWith("http")
			? new URL(url)
			: new URL(url, window.location.origin);
		const path = resolved.pathname;
		return path.startsWith("/api/auth/login") || path.startsWith("/api/auth/logout");
	} catch {
		return false;
	}
};

const isApiLikeRequest = (url: string): boolean => {
	try {
		const resolved = url.startsWith("http")
			? new URL(url)
			: new URL(url, window.location.origin);
		const path = resolved.pathname;
		return path.startsWith("/api") || path.endsWith("/graphql");
	} catch {
		return false;
	}
};

/** Upload endpoint 403 often comes from gateway (e.g. Azure), not session auth. Don't treat as app-wide auth failure. */
const isUploadEndpoint = (url: string): boolean => {
	try {
		const resolved = url.startsWith("http")
			? new URL(url)
			: new URL(url, window.location.origin);
		const path = resolved.pathname.replace(/\/$/, "");
		return /\/api\/projects\/[^/]+\/upload$/.test(path) || /\/api\/logos\/projects\/[^/]+\/upload/.test(path);
	} catch {
		return false;
	}
};

/**
 * Extract error message from response body for classification.
 * Returns null if body cannot be parsed or has no message.
 */
const extractErrorFromResponse = async (response: Response): Promise<Error | null> => {
	try {
		const cloned = response.clone();
		const body = await cloned.json();
		// Common error message field names
		const message = body?.message || body?.error || body?.error_description;
		if (typeof message === "string" && message.length > 0) {
			return new Error(message);
		}
		return null;
	} catch {
		// Body is not JSON or parsing failed - return null to fall back to status-only classification
		return null;
	}
};

/**
 * Self-healing guardrails:
 * - Ensure stale sessions never keep users stuck on 401/403 responses.
 * - Detect backend/frontend build mismatches and reload cleanly.
 */
export const installAuthFetchInterceptor = () => {
	if (typeof window === "undefined" || fetchInterceptorInstalled) return;
	fetchInterceptorInstalled = true;

	const originalFetch = globalThis.fetch.bind(globalThis);
	const healthController = getAppHealthController();

	window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const requestUrl = resolveRequestUrl(input);
		let response: Response;
		try {
			response = await originalFetch(input, init);
		} catch (error) {
			// Detect network failures and report to health controller
			// Only for API-like requests - external fetches shouldn't trigger global offline state
			if (isNetworkError(error) && isApiLikeRequest(requestUrl)) {
				healthController.reportNetworkError("fetch-failed");
			}
			throw error;
		}
		const contentType = response.headers.get("content-type") || "";
		const isApi = isApiLikeRequest(requestUrl);
		const isAuthRequest = isAuthEndpoint(requestUrl);

		if ((response.status === 401 || response.status === 403) && !isAuthRequest) {
			// 403 on upload usually means gateway/upstream (e.g. Azure, Logos), not session auth.
			// BFF returns 403 as JSON; gateway may return HTML. Exclude all upload 403 so upload UI can show the error.
			if (response.status === 403 && isUploadEndpoint(requestUrl)) {
				if (process.env.NODE_ENV === "development") {
					console.info("[self-healing] Upload 403 ignored — not treating as app-wide auth failure");
				}
				return response;
			}

			// Extract error message from response body for accurate classification
			// (e.g., JWTExpired should be retryable, not login_required)
			const errorFromBody = await extractErrorFromResponse(response);
			const category = classifyAuthError(errorFromBody, response.status);
			switch (category) {
				case "network":
					healthController.reportNetworkError("auth-status");
					break;
				case "retryable":
					// Silent retry - don't record failure (won't escalate to logout)
					healthController.reportAuthFailure("auth-status", { recordFailure: false });
					break;
				case "login_required":
					// Record failure - will escalate to logout after 2+ failures
					healthController.reportAuthFailure("auth-status", { recordFailure: true });
					break;
			}
			return response;
		}

		if (response.redirected && isApi && !isAuthRequest) {
			const redirectTarget = response.url || "";
			if (isAuthEndpoint(redirectTarget) || redirectTarget.includes("/login")) {
				healthController.reportAuthFailure("auth-redirect", { recordFailure: true });
				return response;
			}
		}

		if (isApi && !isAuthRequest && contentType.includes("text/html")) {
			// Upload endpoint may return HTML from gateway (e.g. 403 page). Don't treat as app-wide failure.
			if (isUploadEndpoint(requestUrl)) {
				if (process.env.NODE_ENV === "development") {
					console.info("[self-healing] Upload API HTML response ignored — not treating as app degraded");
				}
				return response;
			}
			healthController.reportApiHtmlResponse("api-html-response");
			return response;
		}

		return response;
	};
};

/** Last server version we saw; used when client has no buildId so we still reload on new deploys. */
let lastSeenServerVersion: string | null = null;

export const startVersionCheck = (
	currentVersion: string | undefined,
	intervalMs = 5 * 60 * 1000
) => {
	if (typeof window === "undefined") return () => {};

	const hasClientBuildId = Boolean(currentVersion?.trim());
	let stopped = false;
	const healthController = getAppHealthController();

	const check = async () => {
		if (stopped) return;
		try {
			const response = await fetch("/api/version", {
				method: "GET",
				cache: "no-store",
				credentials: "include",
			});
			if (!response.ok) return;
			const data = (await response.json()) as { version?: string };
			const serverVersion = data?.version?.trim() ?? "";

			if (hasClientBuildId) {
				// Client has buildId: reload when server version differs from client.
				if (serverVersion && serverVersion !== currentVersion) {
					healthController.reportVersionMismatch("version-mismatch");
				}
			} else if (serverVersion) {
				// Client has no buildId (e.g. old Docker deploy): reload when server version changes (new deploy).
				if (lastSeenServerVersion !== null && lastSeenServerVersion !== serverVersion) {
					healthController.reportVersionMismatch("version-mismatch");
				}
				lastSeenServerVersion = serverVersion;
			}
		} catch {
			// Ignore transient network errors; next interval will retry.
		}
	};

	void check();
	const intervalId = window.setInterval(check, intervalMs);

	return () => {
		stopped = true;
		window.clearInterval(intervalId);
	};
};
