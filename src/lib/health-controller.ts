import { requestAuthRecovery } from "@/lib/auth-recovery";
import { resetAuthFailureTracker } from "@/lib/auth-failure-tracker";
import { triggerSoftReload } from "@/lib/hard-reset";
import { isNetworkError } from "@/lib/error-classification";

/**
 * App health represents the *current truth* of the system.
 * UI must be derived from this state and nothing else.
 */
export type AppHealthState =
  | "healthy"          // Everything OK, app may render
  | "recovering"       // Checking auth/backend
  | "degraded"         // Temporary failure, retrying
  | "hard_recovering"  // Browser state corrupted → force reset
  | "offline";         // Network unavailable

type RouteContext = {
  pathname: string | null;
  isPublicRoute: boolean;
};

type Subscriber = (state: AppHealthState) => void;

const DEFAULT_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 20_000;

/**
 * AppHealthController is the SINGLE authority that:
 * - Determines whether the system is healthy
 * - Decides when to retry
 * - Decides when to escalate to a hard reset
 *
 * No other file is allowed to trigger destructive recovery.
 */
class AppHealthController {
  private state: AppHealthState = "recovering";
  private subscribers = new Set<Subscriber>();
  private running = false;
  private inFlight = false;
  private backoffMs = DEFAULT_BACKOFF_MS;
  private retryTimer: number | null = null;
  private routeContext: RouteContext = { pathname: null, isPublicRoute: false };
  private hasEstablishedBaselineHealth = false;

  /* ----------------------------- Public API ----------------------------- */

  /**
   * Called when authentication fails (401/403).
   * This does NOT immediately reset the browser.
   * Instead, it:
   * - Records the failure
   * - Marks the app degraded
   * - Lets escalation rules decide next steps
   */
  reportAuthFailure(reason?: string, options?: { recordFailure?: boolean }) {
    if (!this.hasEstablishedBaselineHealth) return;
    if (this.state === "healthy") {
      this.setState("degraded");
    }
    requestAuthRecovery(reason, options);
  }

  /**
   * These signals indicate API/parse issues. Treat as degraded and retry.
   */
  reportApiHtmlResponse(_reason?: string) {
    if (!this.hasEstablishedBaselineHealth) return;
    if (this.state === "healthy") {
      this.setState("degraded");
    }
    this.scheduleRetry();
  }

  reportSchemaMismatch(_reason?: string) {
    if (!this.hasEstablishedBaselineHealth) return;
    if (this.state === "healthy") {
      this.setState("degraded");
    }
    this.scheduleRetry();
  }

  reportApiParseError(_reason?: string) {
    if (!this.hasEstablishedBaselineHealth) return;
    if (this.state === "healthy") {
      this.setState("degraded");
    }
    this.scheduleRetry();
  }

  /**
   * Version mismatch during rollout: server has a newer build than the client.
   * Trigger a full page reload so the user gets the latest bundle (no logout).
   */
  reportVersionMismatch(_reason?: string) {
    if (!this.hasEstablishedBaselineHealth) return;
    triggerSoftReload();
  }

  /**
   * Called when a network error is detected (offline, fetch failed, etc.).
   * Sets state to offline and schedules retry to self-heal when network restores.
   * Note: No baseline check - network errors are reliable signals even at startup.
   */
  reportNetworkError(_reason?: string) {
    this.setState("offline");
    this.scheduleRetry();
  }

  /**
   * Starts health monitoring.
   * Automatically retries and converges to truth.
   */
  start() {
    if (this.running || typeof window === "undefined") return;
    this.running = true;
    this.attachResumeListeners();
    void this.checkNow();
  }

  stop() {
    this.running = false;
    this.detachResumeListeners();
    if (this.retryTimer) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  subscribe(callback: Subscriber) {
    this.subscribers.add(callback);
    callback(this.state);
    return () => this.subscribers.delete(callback);
  }

  setRouteContext(context: RouteContext) {
    this.routeContext = context;
  }

  getState() {
    return this.state;
  }

  /* --------------------------- Internal Logic --------------------------- */

  private setState(next: AppHealthState) {
    if (this.state === next) return;
    this.state = next;
    for (const subscriber of this.subscribers) {
      subscriber(next);
    }
  }

  private attachResumeListeners() {
    window.addEventListener("focus", this.handleResume);
    window.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  private detachResumeListeners() {
    window.removeEventListener("focus", this.handleResume);
    window.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
  }

  private handleResume = () => {
    void this.checkNow(true);
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      void this.checkNow(true);
    }
  };

  private handleOnline = () => {
    // Network restored - check immediately to recover
    void this.checkNow(true);
  };

  private handleOffline = () => {
    // Network lost - show offline UI immediately
    // (navigator.onLine is reliable, no need to wait for baseline health)
    this.setState("offline");
  };

  private scheduleRetry() {
    if (!this.running) return;
    if (this.retryTimer) {
      window.clearTimeout(this.retryTimer);
    }
    this.retryTimer = window.setTimeout(() => {
      void this.checkNow();
    }, this.backoffMs);
    this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
  }

  /**
   * Core health loop.
   * Always derives state from live backend/auth checks.
   * Never relies on past failures.
   */
  private async checkNow(forceImmediate = false) {
    if (!this.running || this.inFlight) return;
    this.inFlight = true;

    // Check offline state first - skip network calls if browser reports offline
    // (navigator.onLine is reliable, no need to wait for baseline health)
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.setState("offline");
      this.inFlight = false;
      return;
    }

    if (this.state !== "hard_recovering") {
      this.setState("recovering");
    }

    try {
      const authResult = await this.checkAuth();
      if (authResult === "auth_failed") {
        // escalation decision handled elsewhere
        return;
      }
      if (authResult === "network_error") {
        // Network errors are reliable signals - show offline UI even before baseline
        this.setState("offline");
        this.scheduleRetry();
        return;
      }
      if (authResult === "error") {
        this.setState("degraded");
        this.scheduleRetry();
        return;
      }

      const backendResult = await this.checkBackend();
      if (backendResult === "network_error") {
        // Network errors are reliable signals - show offline UI even before baseline
        this.setState("offline");
        this.scheduleRetry();
        return;
      }
      if (backendResult === "error") {
        this.setState("degraded");
        this.scheduleRetry();
        return;
      }

      // System is healthy again
      this.hasEstablishedBaselineHealth = true;
      this.backoffMs = DEFAULT_BACKOFF_MS;
      resetAuthFailureTracker();
      this.setState("healthy");
    } catch (error) {
      // Network errors are reliable signals - show offline UI even before baseline
      if (isNetworkError(error)) {
        this.setState("offline");
      } else {
        this.setState("degraded");
      }
      this.scheduleRetry();
    } finally {
      this.inFlight = false;
      if (forceImmediate && this.state === "degraded") {
        this.scheduleRetry();
      }
    }
  }

  private async checkAuth(): Promise<"ok" | "auth_failed" | "error" | "skipped" | "network_error"> {
    if (this.routeContext.isPublicRoute) {
      return "skipped";
    }

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        this.reportAuthFailure("bootstrap-auth", { recordFailure: true });
        return "auth_failed";
      }

      if (!response.ok) {
        return "error";
      }

      return "ok";
    } catch (error) {
      if (isNetworkError(error)) {
        return "network_error";
      }
      return "error";
    }
  }

  private async checkBackend(): Promise<"ok" | "error" | "network_error"> {
    try {
      const response = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      return response.ok ? "ok" : "error";
    } catch (error) {
      if (isNetworkError(error)) {
        return "network_error";
      }
      return "error";
    }
  }
}

/* --------------------------- Singleton Export --------------------------- */

let controller: AppHealthController | null = null;

export const getAppHealthController = () => {
  if (!controller) {
    controller = new AppHealthController();
  }
  return controller;
};
