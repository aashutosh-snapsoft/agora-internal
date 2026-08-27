"use client";

/**
 * @fileoverview Route-level error boundary for the /projects page.
 *
 * This file is a Next.js App Router error boundary that catches errors in the
 * projects list page (/projects). When an error occurs while rendering the
 * ProjectListClient component or any of its children, this error boundary
 * will display a user-friendly error message instead of crashing the entire app.
 *
 * The error is automatically reported to Sentry with route context for debugging.
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/error-handling} Next.js Error Handling
 */

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorDisplay } from "@/components/error-ui/error-display";

/**
 * Error boundary component for the /projects route.
 *
 * Catches errors in the projects list page and displays a branded error UI
 * with options to retry or navigate to the dashboard.
 *
 * @param props.error - The error that was thrown
 * @param props.reset - Function to reset the error boundary and retry rendering
 */
export default function ProjectsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error, {
			tags: { route: "projects", errorBoundary: "route" },
		});
	}, [error]);

	return (
		<ErrorDisplay
			error={error}
			reset={reset}
			title="Unable to Load Projects"
			message="We encountered an error loading your projects. Please try again."
			secondaryAction={{ label: "Go to Dashboard", href: "/" }}
		/>
	);
}
