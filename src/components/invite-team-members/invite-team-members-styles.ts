import { Avatar, Button, styled, Typography } from "@mui/material";
import { Box } from "@mui/system";

export const StyledListItem = styled(Box)(({ theme }) => ({
	display: "flex",
	height: "56px",
	minHeight: "40px",
	padding: "var(--16, 16px) var(--12, 12px)",
	alignItems: "center",
	alignContent: "center",
	gap: "16px var(--16, 16px)",
	alignSelf: "stretch",
	flexWrap: "wrap",
	borderTop: "1px solid var(--Colors-Divider-Divider-Primary, #E5E7EB)",
}));
export const StyledTypography = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.primary,
	fontFeatureSettings: "'ss01' on, 'cv01' on, 'cv11' on",
	fontFamily: "Satoshi Variable",
	fontSize: "0.875rem",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "1.25rem",
	overflow: "hidden",
	textOverflow: "ellipsis",
}));

export const StyledAvatar = styled(Avatar)(({ theme }) => ({
	display: "flex",
	width: "20px",
	height: "20px",
	justifyContent: "center",
	alignItems: "center",
	flexShrink: 0,
	borderRadius: "var(--80, 80px)",
	background: "var(--black - 4, rgba(0, 0, 0, 0.04))",
}));

export const StyledAddButton = styled(Button)(({ theme }) => ({
	display: "flex",
	padding: " var(--4, 4px) var(--8, 8px)",
	justifyContent: "center",
	alignItems: "center",
	gap: " var(--4, 4px)",
	borderRadius: "var(--8, 8px)",
	background: theme.palette.grey[100],
	color: theme.palette.text.primary,
}));

export const StyledRemoveButton = styled(Button)(({ theme }) => ({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	borderRadius: "var(--8, 8px)",
	color: "var(--Colors-Purple-500, #6950E8)",
	fontWeight: 600,
	fontVariantNumeric: "lining-nums tabular-nums",
}));

export const StyledOptionValue = styled(Box)(({ theme }) => ({
	borderRadius: "var(--16, 16px)",
	background: "var(--Colors-Accent-Accent-Secondary, #F3F4F6)",
	display: "flex",
	padding: "var(--4, 4px) var(--8, 8px)",
	alignItems: "center",
	alignContent: "center",
	gap: "8px var(--8, 8px)",
	flexWrap: "wrap",
}));

export const optionsContainerStyles = {
	borderRadius: "var(--12, 12px)",
	border: "1px solid var(--black-10, rgba(28, 28, 28, 0.10))",
	background: "var(--white-80, rgba(255, 255, 255, 0.80))",
	display: "flex",
	padding: "var(--8, 8px) var(--12, 12px)",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "flex-start",
};

export const multiValueContainerStyles = {
	borderRadius: "var(--16, 16px)",
	background: "var(--Colors-Accent-Accent-Secondary, #F3F4F6)",
	display: "flex",
	padding: "var(--4, 4px) var(--8, 8px)",
	alignItems: "center",
	alignContent: "center",
	gap: "8px var(--8, 8px)",
	flexWrap: "wrap",
	width: "auto",
};
