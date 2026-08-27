import {
  handleWhen,
  retry,
  circuitBreaker,
  timeout,
  wrap,
  ConsecutiveBreaker,
  ExponentialBackoff,
  IPolicy,
  CircuitBreakerPolicy,
  TimeoutStrategy,
  BrokenCircuitError,
} from "cockatiel";

// Error filter: don't retry 4xx client errors (except 429 rate limit)
// Also don't retry BrokenCircuitError - fail fast when circuit is open
const retryableErrorsPolicy = handleWhen((err: Error) => {
  // Fail fast when circuit breaker is open - don't wait through retry backoff
  if (err instanceof BrokenCircuitError) {
    return false;
  }
  const error = err as Error & { status?: number; statusCode?: number };
  const status = error?.status || error?.statusCode;
  if (status && status >= 400 && status < 500 && status !== 429) {
    return false;
  }
  return true;
});

// Retry policy factory
// Note: maxAttempts is retries, not total attempts. Use 2 for 3 total attempts.
function createRetryPolicy(maxAttempts = 2) {
  return retry(retryableErrorsPolicy, {
    maxAttempts,
    backoff: new ExponentialBackoff({
      initialDelay: 300,
      maxDelay: 10000,
    }),
  });
}

// Circuit breaker factory with logging
function createCircuitBreaker(
  name: string,
  options?: { threshold?: number; resetMs?: number }
): CircuitBreakerPolicy {
  const breaker = circuitBreaker(retryableErrorsPolicy, {
    halfOpenAfter: options?.resetMs ?? 30000,
    breaker: new ConsecutiveBreaker(options?.threshold ?? 5),
  });

  breaker.onBreak(() => {
    console.warn(`[resilience] Circuit breaker OPEN: ${name}`);
  });

  breaker.onReset(() => {
    console.info(`[resilience] Circuit breaker CLOSED: ${name}`);
  });

  breaker.onHalfOpen(() => {
    console.info(`[resilience] Circuit breaker HALF-OPEN: ${name}`);
  });

  return breaker;
}

// Factory for custom policies (for other APIs)
export function createResiliencePolicy(
  name: string,
  options?: {
    retryAttempts?: number;
    circuitBreakerThreshold?: number;
    circuitBreakerResetMs?: number;
    timeoutMs?: number;
  }
): IPolicy {
  const retryPolicy = createRetryPolicy(options?.retryAttempts ?? 2);
  const circuitBreakerPolicy = createCircuitBreaker(name, {
    threshold: options?.circuitBreakerThreshold ?? 5,
    resetMs: options?.circuitBreakerResetMs ?? 30000,
  });

  if (options?.timeoutMs) {
    const timeoutPolicy = timeout(options.timeoutMs, TimeoutStrategy.Aggressive);
    return wrap(circuitBreakerPolicy, retryPolicy, timeoutPolicy);
  }

  return wrap(circuitBreakerPolicy, retryPolicy);
}

// Generic wrapper function
export async function withResilience<T>(
  policy: IPolicy,
  fn: () => Promise<T>
): Promise<T> {
  return policy.execute(fn);
}
