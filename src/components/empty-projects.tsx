import { Box, styled, Typography, Button } from "@mui/material";
import React from "react";
import EmptyProjectsIcon from "./icons/EmptyProject";
import AddIcon from "@mui/icons-material/Add";

interface IEmptyProjects {
	setIsCreateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const StyledEmptyPage = styled(Box)(() => ({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	width: "100%",
	minHeight: "60vh",
}));

const StyledEmptyBoxContent = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: theme.spacing(2),
}));

const StyledIconWrapper = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	padding: theme.spacing(1.5),
	borderRadius: theme.spacing(1),
	backgroundColor: theme.palette.background.default,
	"& svg": {
		width: 40,
		height: 40,
		[theme.breakpoints.up("sm")]: {
			width: 48,
			height: 48,
		},
	},
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
	color: theme.palette.grey[900],
	fontVariantNumeric: "lining-nums tabular-nums",
	fontFamily: "Satoshi Variable",
	fontSize: "16px !important",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "26px",
	[theme.breakpoints.up("sm")]: {
		fontSize: "18px !important",
		lineHeight: "28px",
	},
	[theme.breakpoints.up("md")]: {
		fontSize: "20px !important",
		lineHeight: "30px",
	},
}));

const StyledCaption = styled(Typography)(({ theme }) => ({
	color: theme.palette.grey[500],
	fontVariantNumeric: "lining-nums tabular-nums",
	fontFamily: "inter",
	fontSize: "13px !important",
	fontStyle: "normal",
	fontWeight: 600,
	lineHeight: "20px",
	[theme.breakpoints.up("sm")]: {
		fontSize: "14px !important",
		lineHeight: "22px",
	},
	[theme.breakpoints.up("md")]: {
		fontSize: "15px !important",
		lineHeight: "23px",
	},
}));

const EmptyProjects = ({ setIsCreateModalOpen }: IEmptyProjects) => {
	return (
		<StyledEmptyPage>
			<StyledEmptyBoxContent>
				{/* Updated empty state to mirror the new first-login landing design and surface a clear create CTA. */}
				<StyledIconWrapper>
					<EmptyProjectsIcon />
				</StyledIconWrapper>
				<StyledTitle variant="h6" align="center">
					No projects
				</StyledTitle>
				<StyledCaption variant="body2" align="center">
					Get started by creating a new project.
				</StyledCaption>
				<Button
					variant="contained"
					size="medium"
					startIcon={<AddIcon />}
					onClick={() => setIsCreateModalOpen(true)}
					sx={{
						width: { xs: "100%", sm: "auto" },
						px: { xs: 2, sm: 3 },
					}}
				>
					New project
				</Button>
			</StyledEmptyBoxContent>
		</StyledEmptyPage>
	);
};

export default React.memo(EmptyProjects);
