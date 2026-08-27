"use client";

/**
 * @fileoverview Reusable error display component for route-level and component-level error boundaries.
 *
 * This component provides a branded, user-friendly error UI that can be used across the application.
 * It includes:
 * - Socratics branding (logo)
 * - Customizable error title and message
 * - Primary action button (defaults to "Try Again" which calls reset)
 * - Optional secondary navigation button
 * - Collapsible error details (only shown in development mode)
 * - Error digest display for support reference
 *
 * @example
 * // Basic usage in a route error boundary
 * <ErrorDisplay
 *   error={error}
 *   reset={reset}
 *   title="Unable to Load Projects"
 *   message="We encountered an error loading your projects."
 *   secondaryAction={{ label: "Go Home", href: "/" }}
 * />
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/error-handling} Next.js Error Handling
 */

import { useState } from "react";
import {
	Box,
	Typography,
	Card,
	CardContent,
	Button,
	Alert,
	Stack,
	Collapse,
	IconButton,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Logo from "@/components/icons/Logo";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

/**
 * Props for the ErrorDisplay component.
 */
export interface ErrorDisplayProps {
	/** The error object, optionally with a digest for tracking */
	error: Error & { digest?: string };
	/** Function to reset the error boundary and retry rendering */
	reset: () => void;
	/** Custom title for the error display (default: "Something went wrong") */
	title?: string;
	/** Custom message describing the error (default: "We encountered an unexpected error. Please try again.") */
	message?: string;
	/** Custom primary action button (defaults to "Try Again" which calls reset) */
	primaryAction?: { label: string; onClick: () => void };
	/** Optional secondary action button with navigation */
	secondaryAction?: { label: string; href: string };
}

/**
 * A branded error display component for showing user-friendly error messages.
 *
 * Features:
 * - Displays Socratics logo for brand consistency
 * - Shows customizable error title and message
 * - Provides retry functionality via the reset callback
 * - Optional secondary navigation action
 * - Shows error stack trace in development mode only (hidden in production)
 * - Displays error digest for support reference
 *
 * @param props - The component props
 * @returns A centered card with error information and recovery options
 */
export function ErrorDisplay({
	error,
	reset,
	title = "Something went wrong",
	message = "We encountered an unexpected error. Please try again.",
	primaryAction,
	secondaryAction,
}: ErrorDisplayProps) {
	const router = useRouter();
	const [showDetails, setShowDetails] = useState(false);
	const isDevelopment = process.env.NODE_ENV === "development";

	const handlePrimaryClick = primaryAction?.onClick ?? reset;
	const primaryLabel = primaryAction?.label ?? "Try Again";

	const handleSecondaryClick = () => {
		if (secondaryAction?.href) {
			router.push(secondaryAction.href);
		}
	};

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "400px",
				padding: 2,
			}}
		>
			<Card sx={{ maxWidth: 500, width: "100%" }}>
				<CardContent sx={{ padding: 4 }}>
					<Stack spacing={3} alignItems="center">
						<Logo />

						<Typography
							variant="h5"
							textAlign="center"
							fontWeight="bold"
							color="error"
						>
							{title}
						</Typography>

						<Alert severity="error" sx={{ width: "100%" }}>
							{message}
						</Alert>

						{error.digest && (
							<Typography
								variant="caption"
								color="text.secondary"
								textAlign="center"
							>
								Error ID: {error.digest}
							</Typography>
						)}

						<Stack direction="row" spacing={2} sx={{ width: "100%" }}>
							<Button
								variant="contained"
								onClick={handlePrimaryClick}
								fullWidth
							>
								{primaryLabel}
							</Button>

							{secondaryAction && (
								<Button
									variant="outlined"
									onClick={handleSecondaryClick}
									fullWidth
								>
									{secondaryAction.label}
								</Button>
							)}
						</Stack>

						{isDevelopment && (
							<Box sx={{ width: "100%" }}>
								<Button
									size="small"
									onClick={() => setShowDetails(!showDetails)}
									endIcon={
										showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />
									}
									sx={{ mb: 1 }}
								>
									{showDetails ? "Hide" : "Show"} Error Details
								</Button>
								<Collapse in={showDetails}>
									<Box
										sx={{
											backgroundColor: "grey.100",
											borderRadius: 1,
											p: 2,
											overflow: "auto",
											maxHeight: 300,
										}}
									>
										<Typography
											variant="subtitle2"
											color="error"
											gutterBottom
										>
											{error.name}: {error.message}
										</Typography>
										{error.stack && (
											<Typography
												variant="caption"
												component="pre"
												sx={{
													whiteSpace: "pre-wrap",
													wordBreak: "break-word",
													fontFamily: "monospace",
													fontSize: "0.75rem",
													color: "text.secondary",
												}}
											>
												{error.stack}
											</Typography>
										)}
									</Box>
								</Collapse>
							</Box>
						)}

						<Typography
							variant="caption"
							color="text.secondary"
							textAlign="center"
						>
							If this problem persists, please contact our support team.
						</Typography>
					</Stack>
				</CardContent>
			</Card>
		</Box>
	);
}

export default ErrorDisplay;
