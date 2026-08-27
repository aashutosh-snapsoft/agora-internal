import {
  createResiliencePolicy,
  withResilience,
} from "../resilience";
import { BrokenCircuitError } from "cockatiel";

describe("resilience module", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("retry behavior", () => {
    it("should retry on transient failures and succeed", async () => {
      // Create fresh policy for isolation
      // retryAttempts: 2 means 2 retries = 3 total attempts
      const policy = createResiliencePolicy("test-retry-success", {
        retryAttempts: 2,
        circuitBreakerThreshold: 10,
      });

      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("Transient failure");
        }
        return { data: "success" };
      });

      const result = await policy.execute(fn);

      expect(result).toEqual({ data: "success" });
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should fail after max retries exhausted", async () => {
      // retryAttempts: 2 means 2 retries = 3 total attempts
      const policy = createResiliencePolicy("test-retry-fail", {
        retryAttempts: 2,
        circuitBreakerThreshold: 10,
      });

      const fn = jest.fn(async () => {
        throw new Error("Persistent failure");
      });

      await expect(policy.execute(fn)).rejects.toThrow("Persistent failure");
      // 1 initial + 2 retries = 3 total calls
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should NOT retry 4xx client errors", async () => {
      const policy = createResiliencePolicy("test-4xx", {
        retryAttempts: 2,
        circuitBreakerThreshold: 10,
      });

      const fn = jest.fn(async () => {
        const error = new Error("Bad Request") as Error & { status: number };
        error.status = 400;
        throw error;
      });

      await expect(policy.execute(fn)).rejects.toThrow("Bad Request");
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it("should retry 429 rate limit errors", async () => {
      const policy = createResiliencePolicy("test-429", {
        retryAttempts: 2,
        circuitBreakerThreshold: 10,
      });

      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          const error = new Error("Rate limited") as Error & { status: number };
          error.status = 429;
          throw error;
        }
        return { data: "success" };
      });

      const result = await policy.execute(fn);

      expect(result).toEqual({ data: "success" });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should retry 5xx server errors", async () => {
      const policy = createResiliencePolicy("test-5xx", {
        retryAttempts: 2,
        circuitBreakerThreshold: 10,
      });

      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          const error = new Error("Server error") as Error & { status: number };
          error.status = 503;
          throw error;
        }
        return { data: "success" };
      });

      const result = await policy.execute(fn);

      expect(result).toEqual({ data: "success" });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should retry network errors (no status code)", async () => {
      const policy = createResiliencePolicy("test-network", {
        retryAttempts: 2,
        circuitBreakerThreshold: 10,
      });

      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error("fetch failed");
        }
        return { data: "success" };
      });

      const result = await policy.execute(fn);

      expect(result).toEqual({ data: "success" });
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("circuit breaker behavior", () => {
    it("should open circuit after threshold consecutive failures", async () => {
      // Use retryAttempts: 2 to prove retries don't inflate the breaker count
      const policy = createResiliencePolicy("test-cb-open-" + Date.now(), {
        retryAttempts: 2,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 30000,
      });

      const fn = jest.fn(async () => {
        throw new Error("Service unavailable");
      });

      // Trigger failures to open circuit (threshold = 3 consecutive failures)
      for (let i = 0; i < 3; i++) {
        await expect(policy.execute(fn)).rejects.toThrow();
      }

      // Circuit should now be open - next call should fail immediately with BrokenCircuitError
      await expect(policy.execute(fn)).rejects.toThrow(BrokenCircuitError);
    });

    it("should count requests not retry attempts toward breaker threshold", async () => {
      // With retryAttempts: 2 and threshold: 3, it must take exactly 3
      // failed policy.execute() calls to trip the breaker — not fewer.
      // Before the fix (retry outer, CB inner), retries inflated the count
      // and the breaker would open after only 1-2 requests.
      const policy = createResiliencePolicy("test-cb-counting-" + Date.now(), {
        retryAttempts: 2,
        circuitBreakerThreshold: 3,
        circuitBreakerResetMs: 30000,
      });

      const fn = jest.fn(async () => {
        throw new Error("Service unavailable");
      });

      // First 2 requests should fail normally (not BrokenCircuitError)
      for (let i = 0; i < 2; i++) {
        await expect(policy.execute(fn)).rejects.toThrow("Service unavailable");
      }

      // 3rd request should still fail normally (hits threshold but doesn't throw BCError yet)
      await expect(policy.execute(fn)).rejects.toThrow("Service unavailable");

      // 4th request: circuit is now open
      await expect(policy.execute(fn)).rejects.toThrow(BrokenCircuitError);
    });

    it("should allow requests when circuit is closed", async () => {
      const policy = createResiliencePolicy("test-cb-closed-" + Date.now(), {
        retryAttempts: 1,
        circuitBreakerThreshold: 5,
      });

      const fn = jest.fn(async () => ({ data: "success" }));

      const result = await policy.execute(fn);

      expect(result).toEqual({ data: "success" });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should not call function when circuit is open", async () => {
      const policy = createResiliencePolicy("test-cb-no-call-" + Date.now(), {
        retryAttempts: 1,
        circuitBreakerThreshold: 2,
        circuitBreakerResetMs: 30000,
      });

      const fn = jest.fn(async () => {
        throw new Error("Failure");
      });

      // Open the circuit
      await expect(policy.execute(fn)).rejects.toThrow();
      await expect(policy.execute(fn)).rejects.toThrow();

      const callCountBeforeOpen = fn.mock.calls.length;

      // Circuit is open - this should NOT call fn
      await expect(policy.execute(fn)).rejects.toThrow(BrokenCircuitError);

      expect(fn).toHaveBeenCalledTimes(callCountBeforeOpen);
    });

    it("should fail fast when circuit is open without waiting for retry backoff", async () => {
      // Create policy with significant retry backoff to make the bug obvious
      // If circuit breaker is inside retry, BrokenCircuitError will be retried
      // with 500ms+ delays. If properly ordered, it should fail in < 50ms.
      const policy = createResiliencePolicy("test-cb-fail-fast-" + Date.now(), {
        retryAttempts: 3,
        circuitBreakerThreshold: 2,
        circuitBreakerResetMs: 30000,
      });

      const fn = jest.fn(async () => {
        throw new Error("Service unavailable");
      });

      // Open the circuit
      await expect(policy.execute(fn)).rejects.toThrow();
      await expect(policy.execute(fn)).rejects.toThrow();

      // Circuit is now open - measure how long subsequent request takes
      const startTime = Date.now();
      await expect(policy.execute(fn)).rejects.toThrow(BrokenCircuitError);
      const elapsed = Date.now() - startTime;

      // Should fail immediately (< 50ms), not wait through retry backoff (300ms+ per attempt)
      // If this takes > 100ms, the retry policy is incorrectly retrying BrokenCircuitError
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe("timeout behavior", () => {
    it("should timeout slow operations", async () => {
      const policy = createResiliencePolicy("test-timeout-slow-" + Date.now(), {
        retryAttempts: 1,
        circuitBreakerThreshold: 10,
        timeoutMs: 50,
      });

      const fn = jest.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: "success" }), 500);
          })
      );

      await expect(policy.execute(fn)).rejects.toThrow();
    }, 10000);

    it("should complete fast operations before timeout", async () => {
      const policy = createResiliencePolicy("test-timeout-fast-" + Date.now(), {
        retryAttempts: 1,
        circuitBreakerThreshold: 10,
        timeoutMs: 5000,
      });

      const fn = jest.fn(async () => {
        return { data: "success" };
      });

      const result = await policy.execute(fn);
      expect(result).toEqual({ data: "success" });
    });
  });

  describe("withResilience helper", () => {
    it("should wrap async functions with policy", async () => {
      const policy = createResiliencePolicy("test-helper-" + Date.now(), {
        retryAttempts: 1,
        circuitBreakerThreshold: 10,
      });
      const fn = jest.fn(async () => ({ data: "test" }));

      const result = await withResilience(policy, fn);

      expect(result).toEqual({ data: "test" });
    });
  });

  describe("createResiliencePolicy factory", () => {
    it("should create policy with custom options", async () => {
      const policy = createResiliencePolicy("custom-" + Date.now(), {
        retryAttempts: 5,
        circuitBreakerThreshold: 10,
        circuitBreakerResetMs: 60000,
        timeoutMs: 5000,
      });

      const fn = jest.fn(async () => ({ data: "custom" }));
      const result = await policy.execute(fn);

      expect(result).toEqual({ data: "custom" });
    });

    it("should use defaults when options not provided", async () => {
      const policy = createResiliencePolicy("defaults-" + Date.now());

      const fn = jest.fn(async () => ({ data: "defaults" }));
      const result = await policy.execute(fn);

      expect(result).toEqual({ data: "defaults" });
    });
  });
});
