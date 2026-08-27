import * as Sentry from "@sentry/nextjs";

export async function register() {
  try {
    // Only run env validation on node runtime, and never let it crash the app.
    if (process.env.NEXT_RUNTIME === "nodejs") {
      try {
        await import("./env-check");
      } catch (e) {
        console.warn("[Instrumentation] env-check skipped:", e);
      }
    }

    if (process.env.ENABLE_SENTRY === "true" && process.env.SENTRY_DSN) {
      if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("../sentry.server.config");
      }
      if (process.env.NEXT_RUNTIME === "edge") {
        await import("../sentry.edge.config");
      }
    }
  } catch (err) {
    console.error(
      "[Instrumentation] Failed to initialize Sentry. App will continue without it.",
      err
    );
  }
}

/**
 * Custom error handler that captures errors to Sentry and handles
 * server action errors specifically to prevent Envoy connection issues.
 */
export function onRequestError(
  error: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource?: 'react-server-components' | 'react-server-components-payload' | 'server-rendering';
    revalidateReason?: 'on-demand' | 'stale' | undefined;
    renderType?: 'dynamic' | 'dynamic-resume';
  }
): void | Promise<void> {
  // Only capture errors if Sentry is enabled
  if (process.env.ENABLE_SENTRY !== "true" || !process.env.SENTRY_DSN) {
    return;
  }

  // Check if this is a server action error
  const isServerActionError =
    error?.message?.includes('Invalid server action') ||
    error?.message?.includes('Server action') ||
    error?.message?.includes('action ID') ||
    context?.routeType === 'action' ||
    request?.headers?.['Next-Action'] !== undefined;

  if (isServerActionError) {
    // Log server action errors with additional context for debugging
    console.error('[Server Action Error]', {
      message: error?.message,
      actionId: request?.headers?.['Next-Action']?.substring(0, 20) + '...',
      path: request?.path,
      routeType: context?.routeType,
    });

    // Tag the error for Sentry filtering
    Sentry.setTag('error_type', 'server_action');
  }

  // Always capture to Sentry
  return Sentry.captureRequestError(error, request, context);
}
