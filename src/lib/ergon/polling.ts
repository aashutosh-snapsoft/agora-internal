/**
 * Ergon Job Polling Utilities
 * Helpers for polling job status until completion
 */

import type { JobStatus, JobStatusResponse } from "./types";

export const TERMINAL_STATES: JobStatus[] = ["completed", "failed", "cancelled"];

export function isTerminalState(status: JobStatus): boolean {
  return TERMINAL_STATES.includes(status);
}

export interface PollOptions {
  /** Polling interval in milliseconds (default: 5000) */
  interval?: number;
  /** Maximum time to poll in milliseconds (default: 600000 = 10 minutes) */
  timeout?: number;
  /** Callback on each status update */
  onStatusChange?: (status: JobStatusResponse) => void;
  /** AbortSignal to cancel polling */
  signal?: AbortSignal;
}

export interface PollResult {
  status: JobStatusResponse;
  timedOut: boolean;
}

/**
 * Poll job status until it reaches a terminal state
 * Used server-side or in non-React contexts
 */
export async function pollJobUntilComplete(
  fetchStatus: () => Promise<JobStatusResponse>,
  options: PollOptions = {}
): Promise<PollResult> {
  const {
    interval = 5000,
    timeout = 600000,
    onStatusChange,
    signal,
  } = options;

  const startTime = Date.now();
  const maxIterations = Math.ceil(timeout / interval) + 1;

  for (let i = 0; i < maxIterations; i++) {
    if (signal?.aborted) {
      throw new DOMException("Polling aborted", "AbortError");
    }

    const elapsed = Date.now() - startTime;
    if (elapsed >= timeout) {
      const lastStatus = await fetchStatus();
      return { status: lastStatus, timedOut: true };
    }

    const status = await fetchStatus();
    onStatusChange?.(status);

    if (isTerminalState(status.status)) {
      return { status, timedOut: false };
    }

    await sleep(interval, signal);
  }

  // Timeout reached after max iterations
  const finalStatus = await fetchStatus();
  return { status: finalStatus, timedOut: true };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Sleep aborted", "AbortError"));
      return;
    }

    const timeoutId = setTimeout(resolve, ms);

    signal?.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      reject(new DOMException("Sleep aborted", "AbortError"));
    });
  });
}

/**
 * Configuration for React Query based polling
 */
export const ERGON_POLLING_CONFIG = {
  /** Default polling interval */
  defaultInterval: 5000,
  /** Stale time for completed jobs (they won't change) */
  completedStaleTime: Infinity,
  /** Stale time for active jobs */
  activeStaleTime: 0,
} as const;

/**
 * Determine if polling should continue based on job status
 */
export function shouldContinuePolling(status: JobStatus | undefined): boolean {
  if (!status) return false;
  return !isTerminalState(status);
}
