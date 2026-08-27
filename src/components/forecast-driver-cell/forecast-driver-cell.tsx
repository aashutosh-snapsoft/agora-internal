import { Box, Typography } from "@mui/material";
import { FC } from "react";

import { styled } from "@mui/material/styles";
import { ForecastDriverCellProps } from "./forecast-driver-cell.types";

/**
 * Component for displaying and editing forecast driver cells
 *
 * @see {@link CustomForecastCell} - State management in summary-rollups.tsx
 * @see {@link determineForecastLabel} - Display logic in display-forecast-models.ts
 *
 */
const ForecastDriverCell: FC<ForecastDriverCellProps> = ({
	className,
	children,
	state,
}) => {
	if (state === "calculated") {
		className = `${className} calculated`;
	}

	if (state === "assumption-needed") {
		className = `${className} assumption-needed`;
	}

	return (
		<Box className={className}>
			<Typography variant="Text7Medium">{children}</Typography>
		</Box>
	);
};

const StyledForecastDriverCell = styled(ForecastDriverCell)(({ theme }) => ({
	height: "22px",
	margin: "auto 0",
	backgroundColor: theme.palette.accent.secondary,
	borderRadius: 8,
	padding: `${theme.spacing(0.25)} ${theme.spacing(1)}`,
	fontSize: theme.typography.caption.fontSize,
	fontWeight: theme.typography.fontWeightBold,
	lineHeight: 1.35,
	display: "flex",
	alignItems: "center",
	alignSelf: "stretch",
	"&.calculated": {
		backgroundColor: theme.palette.accent.secondary,
	},
	"&.assumption-needed": {
		backgroundColor: theme.palette.warning[300],
		color: theme.palette.warning[800],
	},
}));

export default StyledForecastDriverCell;
export { ForecastDriverCell };
