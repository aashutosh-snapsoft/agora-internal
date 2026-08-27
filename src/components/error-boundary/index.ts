/**
 * @fileoverview Error boundary components with Sentry integration.
 *
 * This module provides components for catching and handling errors at the component level.
 * It wraps react-error-boundary with automatic Sentry error reporting.
 *
 * ## Components
 *
 * - **ErrorBoundary**: Wrap volatile components to catch render errors
 * - **ComponentErrorFallback**: Compact inline error UI (used by ErrorBoundary)
 *
 * ## Hooks
 *
 * - **useErrorBoundary**: Programmatically trigger error boundaries for async errors
 *
 * ## Usage
 *
 * ### Basic Component Wrapping
 * ```tsx
 * import { ErrorBoundary } from "@/components/error-boundary";
 *
 * <ErrorBoundary componentName="DataTable">
 *   <DataTable data={data} />
 * </ErrorBoundary>
 * ```
 *
 * ### Catching Async/Event Handler Errors
 * Error boundaries normally only catch errors during rendering. For errors in
 * event handlers, promises, or RxJS subscriptions, use the `useErrorBoundary` hook:
 *
 * ```tsx
 * import { ErrorBoundary, useErrorBoundary } from "@/components/error-boundary";
 *
 * function MyComponent() {
 *   const { showBoundary } = useErrorBoundary();
 *
 *   const handleClick = async () => {
 *     try {
 *       await riskyOperation();
 *     } catch (error) {
 *       showBoundary(error); // Triggers the nearest ErrorBoundary
 *     }
 *   };
 *
 *   return <button onClick={handleClick}>Do Something</button>;
 * }
 *
 * // Component must be wrapped in ErrorBoundary for hook to work
 * <ErrorBoundary componentName="MyComponent">
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @see {@link https://github.com/bvaughn/react-error-boundary} react-error-boundary documentation
 */

export { ErrorBoundary } from "./error-boundary";
export type { ErrorBoundaryProps } from "./error-boundary";

export { ComponentErrorFallback } from "./component-error-fallback";
export type { ComponentErrorFallbackProps } from "./component-error-fallback";

/**
 * Hook to programmatically trigger the nearest error boundary.
 *
 * Use this hook in components that have async operations (promises, event handlers,
 * RxJS subscriptions) where errors would not normally be caught by error boundaries.
 *
 * @example
 * const { showBoundary } = useErrorBoundary();
 *
 * useEffect(() => {
 *   const subscription = observable$.subscribe({
 *     error: (err) => showBoundary(err),
 *   });
 *   return () => subscription.unsubscribe();
 * }, [showBoundary]);
 */
export { useErrorBoundary } from "react-error-boundary";
