import { handleAuthError, AuthError } from "../error-handler";
import { firstValueFrom, toArray } from "rxjs";

// Mock health controller
const mockReportNetworkError = jest.fn();
const mockReportAuthFailure = jest.fn();

jest.mock("@/lib/health-controller", () => ({
	getAppHealthController: () => ({
		reportNetworkError: mockReportNetworkError,
		reportAuthFailure: mockReportAuthFailure,
	}),
}));

// Mock error classification
jest.mock("@/lib/error-classification", () => ({
	classifyAuthError: (error: Error | null) => {
		if (!error) return "retryable";
		const message = error.message;
		if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
			return "network";
		}
		if (message.includes("JWTExpired")) {
			return "retryable";
		}
		if (message.includes("Token is missing") || message.includes("Login required")) {
			return "login_required";
		}
		return "retryable";
	},
}));

describe("error-handler", () => {
	const mockDispatch = jest.fn();

	beforeEach(() => {
		mockReportNetworkError.mockClear();
		mockReportAuthFailure.mockClear();
		mockDispatch.mockClear();
	});

	describe("handleAuthError", () => {
		describe("network errors", () => {
			it("reports network error for TypeError Failed to fetch", async () => {
				const error = new TypeError("Failed to fetch");
				const observable = handleAuthError(mockDispatch, error);
				const values = await firstValueFrom(observable.pipe(toArray()));

				expect(mockReportNetworkError).toHaveBeenCalledWith("auth-error");
				expect(mockReportAuthFailure).not.toHaveBeenCalled();
				expect(values).toEqual([]);
			});

			it("reports network error for NetworkError", async () => {
				const error = new Error("NetworkError when attempting to fetch");
				const observable = handleAuthError(mockDispatch, error);
				await firstValueFrom(observable.pipe(toArray()));

				expect(mockReportNetworkError).toHaveBeenCalledWith("auth-error");
			});
		});

		describe("retryable errors", () => {
			it("reports auth failure without recording for JWTExpired", async () => {
				const error = new Error("JWTExpired: token has expired");
				const observable = handleAuthError(mockDispatch, error);
				await firstValueFrom(observable.pipe(toArray()));

				expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-error", { recordFailure: false });
				expect(mockReportNetworkError).not.toHaveBeenCalled();
			});

			it("reports auth failure without recording for unknown errors", async () => {
				const error = new Error("Something unexpected");
				const observable = handleAuthError(mockDispatch, error);
				await firstValueFrom(observable.pipe(toArray()));

				expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-error", { recordFailure: false });
			});
		});

		describe("login_required errors", () => {
			it("reports auth failure with recording for Token is missing", async () => {
				const error = new Error("Token is missing");
				const observable = handleAuthError(mockDispatch, error);
				const values = await firstValueFrom(observable.pipe(toArray()));

				expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-error", { recordFailure: true });
				expect(values).toContainEqual(new Error(AuthError.TokenIsMissing));
			});

			it("reports auth failure with recording for Login required", async () => {
				const error = new Error("Login required");
				const observable = handleAuthError(mockDispatch, error);
				const values = await firstValueFrom(observable.pipe(toArray()));

				expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-error", { recordFailure: true });
				expect(values).toContainEqual(new Error(AuthError.LoginRequired));
			});

			it("emits AuthError.TokenIsMissing for token missing errors", async () => {
				const error = new Error("Token is missing");
				const observable = handleAuthError(mockDispatch, error);
				const values = await firstValueFrom(observable.pipe(toArray()));

				expect(values.length).toBe(1);
				expect(values[0].message).toBe(AuthError.TokenIsMissing);
			});

			it("emits AuthError.LoginRequired for login required errors", async () => {
				const error = new Error("Login required");
				const observable = handleAuthError(mockDispatch, error);
				const values = await firstValueFrom(observable.pipe(toArray()));

				expect(values.length).toBe(1);
				expect(values[0].message).toBe(AuthError.LoginRequired);
			});
		});

		it("completes the observable after handling", async () => {
			const error = new Error("Token is missing");
			const observable = handleAuthError(mockDispatch, error);

			let completed = false;
			await new Promise<void>((resolve) => {
				observable.subscribe({
					complete: () => {
						completed = true;
						resolve();
					},
				});
			});

			expect(completed).toBe(true);
		});
	});
});
