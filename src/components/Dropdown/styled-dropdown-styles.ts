import { MenuItem, Theme, Typography, styled } from "@mui/material";

export const selectStyles = {
	display: "flex",
	width: "100",
	height: 60,
	padding: "16px 20px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "flex-start",
	borderRadius: "16px",
	border: "1px solid rgba(28, 28, 28, 0.10)",
	"&:hover": {
		border: "none",
	},

	background: "rgba(255, 255, 255, 0.80)",
	"&. focused": {
		boxSizing: "border-box",
		border: "none",
	},
	"&.MuiOutlinedInput-root": {
		width: "100%",
		borderWidth: 0,
		border: "1px solid rgba(28, 28, 28, 0.10)",
		"& .MuiSelect-select": {
			padding: 0,
		},
		"& fieldset": {
			borderColor: "rgba(28, 28, 28, 0.10)",
		},
		"&.Mui-focused fieldset": {
			border: "none",
		},
	},
	"& .MuiList-root": {
		background: "red",
	},
};

export const menuStyles = {
	borderRadius: "16px",
	"&:hover": {
		border: "1px solid rgba(28, 28, 28, 0.10)",
	},
	border: "1px solid rgba(28, 28, 28, 0.10)",
	background: "rgba(255, 255, 255, 0.80)",
	backdropFilter: "blur(20px)",
	display: "flex",
	width: 320,
	padding: "8px",
	flexDirection: "column",
	alignItems: "flex-start",
	flexShrink: 0,
	margin: 0,
	"&.MuiPaper-root": {
		margin: 0,
	},
	"&.MuiList-root": {
		padding: 0,
		paddingTop: 0,
		paddingBottom: 0,
	},
};

export const StyledSubText = styled(Typography)(({ theme }) => ({
	fontFamily: '"Satoshi Variable", sans-serif',
	fontSize: "0.875rem",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "1.25rem",
	color: "var(--black-40, rgba(28, 28, 28, 0.40))",
	textAlign: "right",
	fontVariantNumeric: "lining-nums tabular-nums",
}));

export const StyledMenuItem = styled(MenuItem)(
	({ theme }: { theme: Theme }) => ({
		"&.MuiButtonBase-root.MuiMenuItem-root": {
			fontSize: theme.typography.body2.fontSize,
		},
		color: "var(--Colors-Text-Text-Primary, #111827)",
		fontVariantNumeric: "lining-nums tabular-nums",
		fontFamily: '"Satoshi Variable", sans-serif',
		fontStyle: "normal",
		fontWeight: 600,
		lineHeight: "1.25rem",
		display: "flex",
		padding: "8px",
		alignItems: "center",
		alignContent: "center",
		gap: "8px 8px",
		alignSelf: "stretch",
		flexWrap: "wrap",
		justifyContent: "space-between",
		borderRadius: theme.spacing(1),
	})
);
