"use client";

/**
 * @fileoverview Global error boundary for the Next.js App Router.
 *
 * This is the root-level error boundary that catches unhandled errors in the
 * application. It renders outside of the root layout, so it must provide its
 * own <html> and <body> tags and cannot use MUI's ThemeProvider.
 *
 * Features:
 * - Branded error UI with Socratics styling
 * - "Try Again" button using Next.js reset() function
 * - "Go to Projects" navigation button
 * - Error details expandable in development mode only
 * - Automatic Sentry error reporting
 * - Error digest display for support reference
 *
 * Note: Since this component renders outside the root layout, it uses inline
 * styles with color constants from the theme instead of MUI components.
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts} Next.js Global Error Handling
 */

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { error as errorColors, grey } from "@/external/essence/theme/colors";

/**
 * Props for the GlobalError component (provided by Next.js).
 */
interface GlobalErrorProps {
	/** The error that was thrown */
	error: Error & { digest?: string };
	/** Function to reset the error boundary and retry rendering */
	reset: () => void;
}

/**
 * Global error boundary component for catching unhandled errors.
 *
 * This component is rendered when an error occurs that isn't caught by a more
 * specific error boundary (route-level or component-level). It provides a
 * user-friendly error page with options to retry or navigate away.
 *
 * The error is automatically reported to Sentry with a "global" tag.
 *
 * @param props - The component props provided by Next.js
 * @returns A full-page error display with recovery options
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
	const [showDetails, setShowDetails] = useState(false);
	const isDevelopment = process.env.NODE_ENV === "development";

	useEffect(() => {
		Sentry.captureException(error, {
			tags: { errorBoundary: "global" },
		});
	}, [error]);

	return (
		<html>
			<body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						minHeight: "100vh",
						backgroundColor: grey[50],
						padding: "16px",
					}}
				>
					<div
						style={{
							maxWidth: "500px",
							width: "100%",
							backgroundColor: "#ffffff",
							borderRadius: "8px",
							boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
							padding: "32px",
						}}
					>
						{/* Logo */}
						<div style={{ textAlign: "center", marginBottom: "24px" }}>
							<svg
								width="120"
								height="32"
								viewBox="0 0 120 32"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<text
									x="0"
									y="24"
									fill={grey[900]}
									fontSize="24"
									fontWeight="bold"
									fontFamily="system-ui, -apple-system, sans-serif"
								>
									Socratics
								</text>
							</svg>
						</div>

						{/* Title */}
						<h1
							style={{
								color: errorColors.main,
								fontSize: "24px",
								fontWeight: "bold",
								textAlign: "center",
								margin: "0 0 16px 0",
							}}
						>
							Something went wrong
						</h1>

						{/* Alert */}
						<div
							style={{
								backgroundColor: errorColors[50],
								border: `1px solid ${errorColors[200]}`,
								borderRadius: "4px",
								padding: "12px 16px",
								marginBottom: "16px",
							}}
						>
							<p
								style={{
									color: errorColors[700],
									margin: 0,
									fontSize: "14px",
								}}
							>
								We encountered an unexpected error. Our team has been notified and is working to fix the issue.
							</p>
						</div>

						{/* Error ID */}
						{error.digest && (
							<p
								style={{
									color: grey[500],
									fontSize: "12px",
									textAlign: "center",
									margin: "0 0 16px 0",
								}}
							>
								Error ID: {error.digest}
							</p>
						)}

						{/* Buttons */}
						<div
							style={{
								display: "flex",
								gap: "12px",
								marginBottom: "16px",
							}}
						>
							<button
								onClick={reset}
								style={{
									flex: 1,
									padding: "12px 16px",
									backgroundColor: grey[900],
									color: "#ffffff",
									border: "none",
									borderRadius: "6px",
									fontSize: "14px",
									fontWeight: "500",
									cursor: "pointer",
								}}
							>
								Try Again
							</button>
							<button
								onClick={() => (window.location.href = "/projects")}
								style={{
									flex: 1,
									padding: "12px 16px",
									backgroundColor: "#ffffff",
									color: grey[700],
									border: `1px solid ${grey[300]}`,
									borderRadius: "6px",
									fontSize: "14px",
									fontWeight: "500",
									cursor: "pointer",
								}}
							>
								Go to Projects
							</button>
						</div>

						{/* Dev Error Details */}
						{isDevelopment && (
							<div>
								<button
									onClick={() => setShowDetails(!showDetails)}
									style={{
										background: "none",
										border: "none",
										color: grey[600],
										fontSize: "12px",
										cursor: "pointer",
										padding: "4px 0",
										marginBottom: "8px",
									}}
								>
									{showDetails ? "▼ Hide" : "▶ Show"} Error Details
								</button>
								{showDetails && (
									<div
										style={{
											backgroundColor: grey[100],
											borderRadius: "4px",
											padding: "12px",
											overflow: "auto",
											maxHeight: "200px",
										}}
									>
										<p
											style={{
												color: errorColors.main,
												fontWeight: "bold",
												fontSize: "12px",
												margin: "0 0 8px 0",
											}}
										>
											{error.name}: {error.message}
										</p>
										{error.stack && (
											<pre
												style={{
													color: grey[600],
													fontSize: "10px",
													fontFamily: "monospace",
													whiteSpace: "pre-wrap",
													wordBreak: "break-word",
													margin: 0,
												}}
											>
												{error.stack}
											</pre>
										)}
									</div>
								)}
							</div>
						)}

						{/* Support message */}
						<p
							style={{
								color: grey[500],
								fontSize: "12px",
								textAlign: "center",
								margin: "16px 0 0 0",
							}}
						>
							If this problem persists, please contact our support team.
						</p>
					</div>
				</div>
			</body>
		</html>
	);
}
