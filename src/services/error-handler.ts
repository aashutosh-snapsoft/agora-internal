import { AppDispatch } from "@/store/store";
import { Observable } from "rxjs";
import { getAppHealthController } from "@/lib/health-controller";
import { classifyAuthError } from "@/lib/error-classification";

export enum AuthError {
	TokenIsMissing = "Token is missing",
	LoginRequired = "Login required",
	JwtExpired = "JWT expired",
}

/**
 * Handles authentication errors.
 *
 * This function handles authentication errors given an error message.
 * Uses error classification to determine appropriate recovery strategy:
 * - Network errors: Show offline UI
 * - Retryable errors: Silent retry without recording failure
 * - Login required: Record failure and escalate to logout
 *
 * @param dispatch - The dispatch function.
 * @param error - The error to handle.
 *
 * @returns An observable that emits the error if authentication is required, otherwise completes.
 */
export function handleAuthError(
	dispatch: AppDispatch,
	error: Error
) {
	return new Observable<Error>((subscriber) => {
		void dispatch;
		const category = classifyAuthError(error);
		const healthController = getAppHealthController();

		switch (category) {
			case "network":
				healthController.reportNetworkError("auth-error");
				break;
			case "retryable":
				// Silent retry - don't record failure (won't escalate to logout)
				healthController.reportAuthFailure("auth-error", { recordFailure: false });
				break;
			case "login_required": {
				// Record failure - will escalate to logout after 2+ failures
				const message = error.message;
				const tokenIsMissing = message.includes("Token is missing");
				const loginRequired = message.includes("Login required");
				const jwtExpired = message.includes("JWTExpired");

				const rationale = tokenIsMissing
					? "Token is missing"
					: loginRequired
					? "Login required"
					: jwtExpired
					? "JWT expired"
					: "Authentication required";

				console.warn(`Handling auth error: ${rationale}; reporting to health controller`);

				if (tokenIsMissing) subscriber.next(new Error(AuthError.TokenIsMissing));
				if (loginRequired) subscriber.next(new Error(AuthError.LoginRequired));
				if (jwtExpired) subscriber.next(new Error(AuthError.JwtExpired));

				healthController.reportAuthFailure("auth-error", { recordFailure: true });
				break;
			}
		}

		subscriber.complete();
	});
}
