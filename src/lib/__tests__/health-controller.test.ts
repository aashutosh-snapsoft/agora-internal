/**
 * @jest-environment jsdom
 */

import { getAppHealthController, type AppHealthState } from "../health-controller";

// Mock dependencies
jest.mock("@/lib/auth-recovery", () => ({
	requestAuthRecovery: jest.fn(),
}));

jest.mock("@/lib/auth-failure-tracker", () => ({
	resetAuthFailureTracker: jest.fn(),
}));

jest.mock("@/lib/hard-reset", () => ({
	triggerSoftReload: jest.fn(),
}));

describe("health-controller", () => {
	let controller: ReturnType<typeof getAppHealthController>;
	let stateChanges: AppHealthState[];

	beforeEach(() => {
		// Reset module state for fresh controller
		jest.resetModules();
		stateChanges = [];

		// Re-import to get fresh instance
		const { getAppHealthController: getController } = require("../health-controller");
		controller = getController();

		// Track state changes
		controller.subscribe((state: AppHealthState) => {
			stateChanges.push(state);
		});
	});

	afterEach(() => {
		controller.stop();
		jest.clearAllMocks();
	});

	describe("reportNetworkError", () => {
		it("transitions state to offline when baseline health is established", () => {
			// Simulate baseline health being established
			// We need to reach healthy state first
			// For testing, we'll access internal state directly
			(controller as any).hasEstablishedBaselineHealth = true;
			(controller as any).setState("healthy");
			stateChanges.length = 0; // Reset tracking

			controller.reportNetworkError("test-reason");

			expect(stateChanges).toContain("offline");
		});

		it("transitions to offline even before baseline health is established", () => {
			// Network errors are reliable signals - no need to wait for baseline
			(controller as any).hasEstablishedBaselineHealth = false;
			(controller as any).running = true;
			stateChanges.length = 0;

			controller.reportNetworkError("test-reason");

			// State should change to offline (network errors don't require baseline)
			expect(controller.getState()).toBe("offline");
			expect(stateChanges).toContain("offline");
		});

		it("schedules a retry when reporting network error", () => {
			(controller as any).hasEstablishedBaselineHealth = true;
			(controller as any).running = true;
			const scheduleRetrySpy = jest.spyOn(controller as any, "scheduleRetry");

			controller.reportNetworkError("test-reason");

			expect(scheduleRetrySpy).toHaveBeenCalled();
		});

		it("sets retryTimer when reporting network error", () => {
			(controller as any).hasEstablishedBaselineHealth = true;
			(controller as any).running = true;

			controller.reportNetworkError("test-reason");

			expect((controller as any).retryTimer).not.toBeNull();
		});

		it("triggers checkNow after retry interval", () => {
			jest.useFakeTimers();
			(controller as any).hasEstablishedBaselineHealth = true;
			(controller as any).running = true;
			const checkNowSpy = jest.spyOn(controller as any, "checkNow");

			controller.reportNetworkError("test-reason");

			// checkNow should not have been called yet
			expect(checkNowSpy).not.toHaveBeenCalled();

			// Advance timers by the default backoff (1000ms)
			jest.advanceTimersByTime(1000);

			expect(checkNowSpy).toHaveBeenCalled();
			jest.useRealTimers();
		});
	});

	describe("online/offline event handlers", () => {
		beforeEach(() => {
			controller.start();
		});

		it("handleOffline sets state to offline", () => {
			(controller as any).setState("healthy");
			stateChanges.length = 0;

			// Simulate offline event
			const offlineEvent = new Event("offline");
			window.dispatchEvent(offlineEvent);

			expect(stateChanges).toContain("offline");
		});

		it("handleOffline sets state to offline even before baseline is established", () => {
			// Ensure baseline is NOT established
			(controller as any).hasEstablishedBaselineHealth = false;
			stateChanges.length = 0;

			// Simulate offline event
			const offlineEvent = new Event("offline");
			window.dispatchEvent(offlineEvent);

			expect(stateChanges).toContain("offline");
		});

		it("handleOnline triggers immediate health check", () => {
			const checkNowSpy = jest.spyOn(controller as any, "checkNow");

			// Simulate online event
			const onlineEvent = new Event("online");
			window.dispatchEvent(onlineEvent);

			expect(checkNowSpy).toHaveBeenCalledWith(true);
		});
	});

	describe("offline state in checkNow", () => {
		it("sets state to offline and skips network calls when navigator.onLine is false", async () => {
			(controller as any).hasEstablishedBaselineHealth = true;
			(controller as any).running = true;

			// Mock navigator.onLine as false
			const originalOnLine = navigator.onLine;
			Object.defineProperty(navigator, "onLine", {
				value: false,
				configurable: true,
			});

			const checkAuthSpy = jest.spyOn(controller as any, "checkAuth");
			const checkBackendSpy = jest.spyOn(controller as any, "checkBackend");

			await (controller as any).checkNow();

			expect(controller.getState()).toBe("offline");
			expect(checkAuthSpy).not.toHaveBeenCalled();
			expect(checkBackendSpy).not.toHaveBeenCalled();

			// Restore
			Object.defineProperty(navigator, "onLine", {
				value: originalOnLine,
				configurable: true,
			});
		});

		it("sets state to offline even before baseline is established when navigator.onLine is false", async () => {
			// Ensure baseline is NOT established (simulating app startup)
			(controller as any).hasEstablishedBaselineHealth = false;
			(controller as any).running = true;
			stateChanges.length = 0;

			// Mock navigator.onLine as false
			const originalOnLine = navigator.onLine;
			Object.defineProperty(navigator, "onLine", {
				value: false,
				configurable: true,
			});

			await (controller as any).checkNow();

			expect(controller.getState()).toBe("offline");
			expect(stateChanges).toContain("offline");

			// Restore
			Object.defineProperty(navigator, "onLine", {
				value: originalOnLine,
				configurable: true,
			});
		});
	});

	describe("offline detection at startup", () => {
		it("start() sets offline state immediately when navigator.onLine is false", async () => {
			// Mock navigator.onLine as false (simulating app starting while offline)
			const originalOnLine = navigator.onLine;
			Object.defineProperty(navigator, "onLine", {
				value: false,
				configurable: true,
			});

			stateChanges.length = 0;
			controller.start();

			// Allow async checkNow to complete
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(controller.getState()).toBe("offline");

			// Restore
			Object.defineProperty(navigator, "onLine", {
				value: originalOnLine,
				configurable: true,
			});
		});

		it("sets offline state when fetch fails with network error even if navigator.onLine is true", async () => {
			// This tests captive portal / DNS failure scenarios where browser thinks it's online
			// but fetch actually fails with TypeError("Failed to fetch")
			(controller as any).hasEstablishedBaselineHealth = false;
			(controller as any).running = true;

			// Ensure navigator.onLine is true (browser thinks it's online)
			const originalOnLine = navigator.onLine;
			Object.defineProperty(navigator, "onLine", {
				value: true,
				configurable: true,
			});

			// Mock checkAuth to return network_error (simulating fetch failure)
			jest.spyOn(controller as any, "checkAuth").mockResolvedValue("network_error");

			stateChanges.length = 0;
			await (controller as any).checkNow();

			expect(controller.getState()).toBe("offline");
			expect(stateChanges).toContain("offline");

			// Restore
			Object.defineProperty(navigator, "onLine", {
				value: originalOnLine,
				configurable: true,
			});
		});

		it("sets offline state when backend check fails with network error before baseline", async () => {
			(controller as any).hasEstablishedBaselineHealth = false;
			(controller as any).running = true;

			// Ensure navigator.onLine is true
			const originalOnLine = navigator.onLine;
			Object.defineProperty(navigator, "onLine", {
				value: true,
				configurable: true,
			});

			// Mock checkAuth to succeed, checkBackend to return network_error
			jest.spyOn(controller as any, "checkAuth").mockResolvedValue("ok");
			jest.spyOn(controller as any, "checkBackend").mockResolvedValue("network_error");

			stateChanges.length = 0;
			await (controller as any).checkNow();

			expect(controller.getState()).toBe("offline");
			expect(stateChanges).toContain("offline");

			// Restore
			Object.defineProperty(navigator, "onLine", {
				value: originalOnLine,
				configurable: true,
			});
		});

		it("reportNetworkError sets offline state even before baseline is established", () => {
			(controller as any).hasEstablishedBaselineHealth = false;
			(controller as any).running = true;
			stateChanges.length = 0;

			controller.reportNetworkError("test-reason");

			expect(controller.getState()).toBe("offline");
			expect(stateChanges).toContain("offline");
		});
	});

	describe("AppHealthState includes offline", () => {
		it("can set state to offline", () => {
			(controller as any).setState("offline");
			expect(controller.getState()).toBe("offline");
		});

		it("notifies subscribers when state changes to offline", () => {
			stateChanges.length = 0;
			(controller as any).setState("offline");
			expect(stateChanges).toContain("offline");
		});
	});
});
