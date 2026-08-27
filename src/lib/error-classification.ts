/**
 * Error classification for auth-related errors.
 * Categorizes errors to determine appropriate recovery strategy.
 */

export type AuthErrorCategory = "retryable" | "login_required" | "network";

/**
 * Detects if an error is a network-related failure.
 * Network errors occur when the browser cannot reach the server at all.
 */
export function isNetworkError(error: unknown): boolean {
	// Check navigator.onLine first
	if (typeof navigator !== "undefined" && !navigator.onLine) {
		return true;
	}

	if (error instanceof TypeError) {
		const message = error.message.toLowerCase();
		// Common network failure messages across browsers
		if (
			message.includes("failed to fetch") ||
			message.includes("network request failed") ||
			message.includes("networkerror") ||
			message.includes("load failed")
		) {
			return true;
		}
	}

	// DOMException with network error
	if (error instanceof DOMException && error.name === "NetworkError") {
		return true;
	}

	return false;
}

/**
 * HTTP status codes that indicate temporary server issues.
 * These should be retried automatically.
 */
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

/**
 * Classifies an auth-related error into one of three categories:
 * - `network`: Browser cannot reach the server (offline, DNS failure, etc.)
 * - `retryable`: Temporary failure that may resolve on retry (502/503/504, expired tokens)
 * - `login_required`: User must authenticate again (invalid session, missing token)
 *
 * @param error - The error object (may be null for status-code-only classification)
 * @param statusCode - Optional HTTP status code from the response
 */
export function classifyAuthError(
	error: Error | null,
	statusCode?: number
): AuthErrorCategory {
	// Network errors take precedence
	if (error && isNetworkError(error)) {
		return "network";
	}

	// Check for retryable status codes
	if (statusCode && RETRYABLE_STATUS_CODES.has(statusCode)) {
		return "retryable";
	}

	// Check error message for classification
	if (error) {
		const message = error.message;

		// JWT expired can be auto-refreshed server-side - treat as retryable
		if (message.includes("JWTExpired")) {
			return "retryable";
		}

		// These errors require user to log in again
		if (
			message.includes("Token is missing") ||
			message.includes("Login required") ||
			message.includes("authenticated: false")
		) {
			return "login_required";
		}
	}

	// 401/403 without specific message - default to login_required
	if (statusCode === 401 || statusCode === 403) {
		return "login_required";
	}

	// Unknown errors - default to retryable to avoid unnecessary logouts
	return "retryable";
}
