"use client";

import { Box, Button, Typography } from "@mui/material";
import { AppHealthState } from "@/lib/health-controller";

type AppHealthOverlayProps = {
	state: AppHealthState;
};

type OverlayContent = {
	title: string;
	message: string;
	showRetryButton: boolean;
};

const getOverlayContent = (state: AppHealthState): OverlayContent => {
	switch (state) {
		case "offline":
			return {
				title: "You appear to be offline",
				message: "Please check your internet connection. We'll reconnect automatically when you're back online.",
				showRetryButton: true,
			};
		case "degraded":
		case "hard_recovering":
		default:
			return {
				title: "We're having trouble connecting",
				message: "Retrying...",
				showRetryButton: false,
			};
	}
};

const handleRetry = () => {
	window.location.reload();
};

const AppHealthOverlay = ({ state }: AppHealthOverlayProps) => {
	const { title, message, showRetryButton } = getOverlayContent(state);

	return (
		<Box
			sx={{
				position: "fixed",
				inset: 0,
				zIndex: 2000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "background.default",
				px: 3,
			}}
		>
			<Box
				sx={{
					maxWidth: 520,
					textAlign: "center",
					display: "flex",
					flexDirection: "column",
					gap: 2,
				}}
			>
				<Typography variant="h5" component="h1">
					{title}
				</Typography>
				<Typography variant="body1" color="text.secondary">
					{message}
				</Typography>
				{showRetryButton && (
					<Button
						variant="contained"
						onClick={handleRetry}
						sx={{ mt: 2, alignSelf: "center" }}
					>
						Try Again
					</Button>
				)}
			</Box>
		</Box>
	);
};

export default AppHealthOverlay;
