/**
 * @jest-environment jsdom
 */

import { classifyAuthError, isNetworkError } from "../error-classification";

describe("error-classification", () => {
	// Ensure navigator.onLine is true for tests unless we explicitly set it false
	const originalOnLine = Object.getOwnPropertyDescriptor(navigator, "onLine");

	beforeEach(() => {
		Object.defineProperty(navigator, "onLine", {
			value: true,
			configurable: true,
		});
	});

	afterEach(() => {
		if (originalOnLine) {
			Object.defineProperty(navigator, "onLine", originalOnLine);
		}
	});

	describe("isNetworkError", () => {
		it("returns true when navigator.onLine is false", () => {
			Object.defineProperty(navigator, "onLine", {
				value: false,
				configurable: true,
			});

			expect(isNetworkError(new Error("any error"))).toBe(true);
		});

		it("returns true for TypeError with 'Failed to fetch'", () => {
			const error = new TypeError("Failed to fetch");
			expect(isNetworkError(error)).toBe(true);
		});

		it("returns true for TypeError with 'network request failed'", () => {
			const error = new TypeError("network request failed");
			expect(isNetworkError(error)).toBe(true);
		});

		it("returns true for TypeError with 'NetworkError'", () => {
			const error = new TypeError("NetworkError when attempting to fetch resource");
			expect(isNetworkError(error)).toBe(true);
		});

		it("returns true for TypeError with 'Load failed'", () => {
			const error = new TypeError("Load failed");
			expect(isNetworkError(error)).toBe(true);
		});

		it("returns true for DOMException with name NetworkError", () => {
			const error = new DOMException("Network error", "NetworkError");
			expect(isNetworkError(error)).toBe(true);
		});

		it("returns false for regular Error", () => {
			const error = new Error("Something went wrong");
			expect(isNetworkError(error)).toBe(false);
		});

		it("returns false for TypeError with non-network message", () => {
			const error = new TypeError("Cannot read property 'foo' of undefined");
			expect(isNetworkError(error)).toBe(false);
		});

		it("returns false for null", () => {
			expect(isNetworkError(null)).toBe(false);
		});

		it("returns false for undefined", () => {
			expect(isNetworkError(undefined)).toBe(false);
		});
	});

	describe("classifyAuthError", () => {
		describe("network errors", () => {
			it("classifies TypeError 'Failed to fetch' as network", () => {
				const error = new TypeError("Failed to fetch");
				expect(classifyAuthError(error)).toBe("network");
			});

			it("classifies DOMException NetworkError as network", () => {
				const error = new DOMException("Network error", "NetworkError");
				expect(classifyAuthError(error)).toBe("network");
			});
		});

		describe("retryable errors", () => {
			it("classifies HTTP 502 as retryable", () => {
				expect(classifyAuthError(null, 502)).toBe("retryable");
			});

			it("classifies HTTP 503 as retryable", () => {
				expect(classifyAuthError(null, 503)).toBe("retryable");
			});

			it("classifies HTTP 504 as retryable", () => {
				expect(classifyAuthError(null, 504)).toBe("retryable");
			});

			it("classifies JWTExpired error as retryable", () => {
				const error = new Error("JWTExpired: token has expired");
				expect(classifyAuthError(error)).toBe("retryable");
			});
		});

		describe("login_required errors", () => {
			it("classifies 'Token is missing' as login_required", () => {
				const error = new Error("Token is missing");
				expect(classifyAuthError(error)).toBe("login_required");
			});

			it("classifies 'Login required' as login_required", () => {
				const error = new Error("Login required");
				expect(classifyAuthError(error)).toBe("login_required");
			});

			it("classifies 'authenticated: false' as login_required", () => {
				const error = new Error("Response: authenticated: false");
				expect(classifyAuthError(error)).toBe("login_required");
			});

			it("classifies HTTP 401 without specific error as login_required", () => {
				expect(classifyAuthError(null, 401)).toBe("login_required");
			});

			it("classifies HTTP 403 without specific error as login_required", () => {
				expect(classifyAuthError(null, 403)).toBe("login_required");
			});
		});

		describe("unknown errors", () => {
			it("defaults to retryable for unknown errors", () => {
				const error = new Error("Something unexpected happened");
				expect(classifyAuthError(error)).toBe("retryable");
			});

			it("defaults to retryable for null error without status code", () => {
				expect(classifyAuthError(null)).toBe("retryable");
			});
		});

		describe("priority handling", () => {
			it("prioritizes network detection over status code", () => {
				const error = new TypeError("Failed to fetch");
				// Even with a 401 status, network error takes priority
				expect(classifyAuthError(error, 401)).toBe("network");
			});

			it("prioritizes retryable status codes over login_required messages", () => {
				// 503 status code should be retryable even with a login-related message
				const error = new Error("Login required");
				expect(classifyAuthError(error, 503)).toBe("retryable");
			});
		});
	});
});
