/**
 * @fileoverview Error UI components for displaying user-friendly error messages.
 *
 * This module exports the ErrorDisplay component which is used by route-level
 * error boundaries (error.tsx files) to show branded error pages.
 *
 * @example
 * import { ErrorDisplay } from "@/components/error-ui";
 *
 * export default function ProjectsError({ error, reset }) {
 *   return (
 *     <ErrorDisplay
 *       error={error}
 *       reset={reset}
 *       title="Unable to Load Projects"
 *     />
 *   );
 * }
 */

export { ErrorDisplay } from "./error-display";
export type { ErrorDisplayProps } from "./error-display";
