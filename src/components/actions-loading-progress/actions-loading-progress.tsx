import { Box, LinearProgress, Typography } from "@mui/material";
import { FC } from "react";

interface ActionsLoadingProgressProps {
	loading_text: string;
}

import { styled, useTheme } from "@mui/material/styles";

const ActionsLoadingProgress: FC<ActionsLoadingProgressProps> = ({
	loading_text,
}) => {
	const theme = useTheme();
	return (
		<Box
			display="flex"
			flexDirection="column"
			gap="20px"
			sx={{ textAlign: "center", p: 4 }}
		>
			<LinearProgress variant="indeterminate" />
			<Typography
				sx={{
					color: theme.palette.secondary[500],
					fontFeatureSettings: "'ss01' on, 'cv01' on, 'cv11' on",
					fontFamily: "Satoshi Variable",
					fontSize: "15px",
					fontWeight: "500",
				}}
			>
				{loading_text}
			</Typography>
		</Box>
	);
};

const StyledActionsLoadingProgress = styled(ActionsLoadingProgress)(
	({ theme }) => ({
		backgroundColor: theme.palette.background.paper,
		borderRadius: theme.shape.borderRadius,
		boxShadow: theme.shadows[1],
		padding: theme.spacing(2),
		"&:hover": {
			boxShadow: theme.shadows[3],
			transition: theme.transitions.create("box-shadow", {
				duration: theme.transitions.duration.short,
			}),
		},
	})
);

export default StyledActionsLoadingProgress;
export { ActionsLoadingProgress };
