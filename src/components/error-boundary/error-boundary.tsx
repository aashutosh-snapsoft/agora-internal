"use client";

/**
 * @fileoverview Component-level error boundary with Sentry integration.
 *
 * This module provides a wrapper around react-error-boundary that automatically
 * reports errors to Sentry with component context. It's designed for wrapping
 * volatile components that may throw errors during rendering or in async operations.
 *
 * Key features:
 * - Automatic Sentry error reporting with component tags
 * - Compact inline fallback UI that preserves surrounding layout
 * - Reset functionality for error recovery
 * - Support for resetKeys to auto-reset when props change
 *
 * For catching async/event handler errors (like RxJS subscriptions), use the
 * `useErrorBoundary` hook exported from this module.
 *
 * @example
 * // Basic usage - wrap a volatile component
 * import { ErrorBoundary } from "@/components/error-boundary";
 *
 * function MyPage() {
 *   return (
 *     <ErrorBoundary componentName="DataTable">
 *       <DataTable data={data} />
 *     </ErrorBoundary>
 *   );
 * }
 *
 * @example
 * // With useErrorBoundary for async errors (RxJS subscriptions)
 * import { ErrorBoundary, useErrorBoundary } from "@/components/error-boundary";
 *
 * function ChatComponent() {
 *   const { showBoundary } = useErrorBoundary();
 *
 *   useEffect(() => {
 *     const subscription = messages$.subscribe({
 *       next: (msg) => handleMessage(msg),
 *       error: (err) => showBoundary(err), // Triggers the error boundary
 *     });
 *     return () => subscription.unsubscribe();
 *   }, [showBoundary]);
 *
 *   return <div>Chat content</div>;
 * }
 *
 * // Must be wrapped in ErrorBoundary for useErrorBoundary to work
 * export default function WrappedChat() {
 *   return (
 *     <ErrorBoundary componentName="Chat">
 *       <ChatComponent />
 *     </ErrorBoundary>
 *   );
 * }
 *
 * @see {@link https://github.com/bvaughn/react-error-boundary} react-error-boundary
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/features/error-boundary/} Sentry Error Boundaries
 */

import { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import * as Sentry from "@sentry/nextjs";
import { ComponentErrorFallback } from "./component-error-fallback";

/**
 * Props for the ErrorBoundary component.
 */
export interface ErrorBoundaryProps {
	/** The children to render inside the error boundary */
	children: ReactNode;
	/** Name of the component being wrapped (used for Sentry tags and fallback UI) */
	componentName: string;
	/** Custom fallback UI to show when an error occurs (defaults to ComponentErrorFallback) */
	fallback?: ReactNode;
	/** Array of values that, when changed, will reset the error boundary */
	resetKeys?: unknown[];
	/** Callback invoked when the error boundary resets */
	onReset?: () => void;
	/** Custom error handler called when an error is caught (Sentry reporting happens automatically) */
	onError?: (error: unknown, errorInfo: React.ErrorInfo) => void;
}

/**
 * A component-level error boundary that wraps react-error-boundary with Sentry integration.
 *
 * This component catches JavaScript errors anywhere in its child component tree,
 * reports them to Sentry with component context, and displays a fallback UI.
 *
 * For async errors (promises, event handlers, RxJS subscriptions), use the
 * `useErrorBoundary` hook inside the wrapped component to manually trigger the boundary.
 *
 * @param props - The component props
 * @returns The children if no error, or fallback UI if an error occurred
 */
export function ErrorBoundary({
	children,
	componentName,
	fallback,
	resetKeys,
	onReset,
	onError,
}: ErrorBoundaryProps) {
	const handleError = (error: unknown, errorInfo: React.ErrorInfo) => {
		// Report to Sentry with component context
		Sentry.withScope((scope) => {
			scope.setTag("component", componentName);
			scope.setTag("errorBoundary", "component");
			scope.setExtra("componentStack", errorInfo.componentStack);
			Sentry.captureException(error);
		});

		// Call custom error handler if provided
		onError?.(error, errorInfo);
	};

	return (
		<ReactErrorBoundary
			resetKeys={resetKeys}
			onReset={onReset}
			onError={handleError}
			fallbackRender={({ error, resetErrorBoundary }) =>
				fallback ?? (
					<ComponentErrorFallback
						error={error instanceof Error ? error : new Error(String(error))}
						reset={resetErrorBoundary}
						componentName={componentName}
					/>
				)
			}
		>
			{children}
		</ReactErrorBoundary>
	);
}

export default ErrorBoundary;
