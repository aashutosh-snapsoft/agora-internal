/**
 * @jest-environment jsdom
 */

import { installAuthFetchInterceptor } from "../self-healing";

// Mock health controller
const mockReportNetworkError = jest.fn();
const mockReportAuthFailure = jest.fn();
const mockReportApiHtmlResponse = jest.fn();

jest.mock("@/lib/health-controller", () => ({
	getAppHealthController: () => ({
		reportNetworkError: mockReportNetworkError,
		reportAuthFailure: mockReportAuthFailure,
		reportApiHtmlResponse: mockReportApiHtmlResponse,
	}),
}));

// Mock error classification - mirrors real implementation logic
jest.mock("@/lib/error-classification", () => ({
	isNetworkError: (error: unknown) => {
		if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
			return true;
		}
		return false;
	},
	classifyAuthError: (error: Error | null, statusCode?: number) => {
		// Check error message first (like real implementation)
		if (error) {
			const message = error.message;
			if (message.includes("JWTExpired")) {
				return "retryable";
			}
			if (message.includes("Token is missing") || message.includes("Login required")) {
				return "login_required";
			}
		}
		// Fall back to status code
		if (statusCode === 401 || statusCode === 403) {
			return "login_required";
		}
		if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
			return "retryable";
		}
		return "retryable";
	},
}));

// Helper to create mock response with clone/json support
const createMockResponse = (options: {
	status: number;
	ok?: boolean;
	body?: Record<string, unknown>;
	contentType?: string;
	redirected?: boolean;
	url?: string;
}) => ({
	status: options.status,
	ok: options.ok ?? options.status >= 200 && options.status < 300,
	headers: new Headers({ "content-type": options.contentType ?? "application/json" }),
	redirected: options.redirected ?? false,
	url: options.url ?? "",
	clone: function() {
		return {
			json: () => options.body !== undefined
				? Promise.resolve(options.body)
				: Promise.reject(new Error("No body")),
		};
	},
});

describe("self-healing", () => {
	let originalFetch: typeof global.fetch;

	beforeEach(() => {
		// Store original fetch
		originalFetch = global.fetch;
		// Reset mocks
		mockReportNetworkError.mockClear();
		mockReportAuthFailure.mockClear();
		mockReportApiHtmlResponse.mockClear();
		// Reset module state
		jest.resetModules();
	});

	afterEach(() => {
		// Restore original fetch
		global.fetch = originalFetch;
	});

	describe("installAuthFetchInterceptor", () => {
		it("reports network error when API fetch throws TypeError", async () => {
			// Setup fetch to throw network error
			global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));

			// Re-import to get fresh module with mocked fetch
			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			// Attempt fetch to API endpoint
			await expect(global.fetch("/api/test")).rejects.toThrow("Failed to fetch");

			expect(mockReportNetworkError).toHaveBeenCalledWith("fetch-failed");
		});

		it("does NOT report network error when non-API fetch throws TypeError", async () => {
			// Setup fetch to throw network error
			global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));

			// Re-import to get fresh module with mocked fetch
			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			// Attempt fetch to external (non-API) URL
			await expect(global.fetch("https://formsubmit.co/test")).rejects.toThrow("Failed to fetch");

			// Should NOT trigger global offline state for non-API requests
			expect(mockReportNetworkError).not.toHaveBeenCalled();
		});

		it("does NOT report network error for relative non-API paths", async () => {
			// Setup fetch to throw network error
			global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			// Attempt fetch to non-API path (e.g., static asset)
			await expect(global.fetch("/images/logo.png")).rejects.toThrow("Failed to fetch");

			expect(mockReportNetworkError).not.toHaveBeenCalled();
		});

		it("reports auth failure with recordFailure:true for 401 responses", async () => {
			// Setup fetch to return 401 with generic error
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 401, body: { message: "Unauthorized" } })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-status", { recordFailure: true });
		});

		it("reports auth failure with recordFailure:true for 403 responses", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 403, body: { message: "Forbidden" } })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-status", { recordFailure: true });
		});

		it("does not report auth failure for auth endpoints", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 401, body: { message: "Unauthorized" } })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/auth/login");

			expect(mockReportAuthFailure).not.toHaveBeenCalled();
		});

		it("does not report auth failure for upload endpoint 403", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 403, body: { message: "Forbidden" } })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/projects/123/upload");

			expect(mockReportAuthFailure).not.toHaveBeenCalled();
		});

		it("reports API HTML response for API endpoints returning HTML", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 200, ok: true, contentType: "text/html", body: {} })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportApiHtmlResponse).toHaveBeenCalledWith("api-html-response");
		});
	});

	describe("401/403 response body parsing", () => {
		it("classifies JWTExpired as retryable with recordFailure:false", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 401, body: { message: "JWTExpired: token has expired" } })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-status", { recordFailure: false });
		});

		it("classifies Token is missing as login_required with recordFailure:true", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 401, body: { message: "Token is missing" } })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-status", { recordFailure: true });
		});

		it("classifies Login required as login_required with recordFailure:true", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 401, body: { message: "Login required" } })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-status", { recordFailure: true });
		});

		it("falls back to login_required when body has no message", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 401, body: {} })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-status", { recordFailure: true });
		});

		it("falls back to login_required when body parsing throws", async () => {
			// Create response where clone().json() throws
			global.fetch = jest.fn().mockResolvedValue({
				status: 401,
				ok: false,
				headers: new Headers({ "content-type": "text/html" }),
				redirected: false,
				url: "",
				clone: () => ({
					json: () => Promise.reject(new SyntaxError("Unexpected token <")),
				}),
			});

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-status", { recordFailure: true });
		});

		it("extracts error from error field if message is not present", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 401, body: { error: "JWTExpired" } })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-status", { recordFailure: false });
		});

		it("extracts error from error_description field", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 401, body: { error_description: "JWTExpired" } })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-status", { recordFailure: false });
		});

		it("handles 403 with JWTExpired as retryable", async () => {
			global.fetch = jest.fn().mockResolvedValue(
				createMockResponse({ status: 403, body: { message: "JWTExpired" } })
			);

			jest.isolateModules(() => {
				const { installAuthFetchInterceptor: install } = require("../self-healing");
				install();
			});

			await global.fetch("/api/test");

			expect(mockReportAuthFailure).toHaveBeenCalledWith("auth-status", { recordFailure: false });
		});
	});
});
