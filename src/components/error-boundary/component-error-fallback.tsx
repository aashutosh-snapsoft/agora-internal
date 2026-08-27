"use client";

/**
 * @fileoverview Compact inline fallback UI for component-level error boundaries.
 *
 * This component provides a lightweight error display that preserves the surrounding
 * layout when a component fails. Unlike the full-page ErrorDisplay, this is designed
 * to be embedded inline within a page, showing that a specific section failed while
 * keeping the rest of the page functional.
 *
 * Features:
 * - Compact design that fits within component bounds
 * - "Retry" button for error recovery
 * - Expandable error details (development mode only)
 * - Displays component name for easier debugging
 *
 * @example
 * // Used automatically by ErrorBoundary, but can be used directly:
 * <ComponentErrorFallback
 *   error={error}
 *   reset={resetErrorBoundary}
 *   componentName="DataTable"
 * />
 */

import { useState } from "react";
import {
	Box,
	Typography,
	Button,
	Alert,
	Collapse,
	Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

/**
 * Props for the ComponentErrorFallback component.
 */
export interface ComponentErrorFallbackProps {
	/** The error that was caught */
	error: Error;
	/** Function to reset the error boundary and retry rendering */
	reset: () => void;
	/** Optional name of the component that failed (shown in the error message) */
	componentName?: string;
}

/**
 * A compact, inline error fallback for component-level errors.
 *
 * This component is designed to be displayed within the layout where the failed
 * component would normally render, preserving the surrounding page structure.
 * It shows a brief error message and a retry button, with expandable details
 * available in development mode.
 *
 * @param props - The component props
 * @returns An inline error card with retry functionality
 */
export function ComponentErrorFallback({
	error,
	reset,
	componentName,
}: ComponentErrorFallbackProps) {
	const [showDetails, setShowDetails] = useState(false);
	const isDevelopment = process.env.NODE_ENV === "development";

	return (
		<Box
			sx={{
				p: 3,
				border: 1,
				borderColor: "error.light",
				borderRadius: 1,
				backgroundColor: "error.50",
			}}
		>
			<Stack spacing={2}>
				<Alert severity="error" variant="outlined">
					<Typography variant="body2">
						{componentName
							? `Unable to load ${componentName}`
							: "This section could not be loaded"}
					</Typography>
				</Alert>

				<Stack direction="row" spacing={1}>
					<Button
						variant="contained"
						size="small"
						onClick={reset}
					>
						Retry
					</Button>

					{isDevelopment && (
						<Button
							size="small"
							onClick={() => setShowDetails(!showDetails)}
							endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						>
							Details
						</Button>
					)}
				</Stack>

				{isDevelopment && (
					<Collapse in={showDetails}>
						<Box
							sx={{
								backgroundColor: "grey.100",
								borderRadius: 1,
								p: 2,
								overflow: "auto",
								maxHeight: 200,
							}}
						>
							<Typography
								variant="caption"
								color="error"
								fontWeight="bold"
								display="block"
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
										fontSize: "0.7rem",
										color: "text.secondary",
										margin: 0,
									}}
								>
									{error.stack}
								</Typography>
							)}
						</Box>
					</Collapse>
				)}
			</Stack>
		</Box>
	);
}

export default ComponentErrorFallback;
