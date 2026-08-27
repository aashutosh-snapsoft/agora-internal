import { PropsWithChildren } from "react";
import { Box, styled, useMediaQuery, useTheme } from "@mui/material";
// LAYOUT BASED HOOK
import useLayout from "../dashboard/context/useLayout";
import { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COMPACT } from "./styles/sidebar";

// STYLED COMPONENT
const RootBox = styled(Box)<{ compact: number }>(({ theme, compact }) => ({
	marginLeft: compact ? SIDEBAR_WIDTH_COMPACT : SIDEBAR_WIDTH_EXPANDED,
	transition: "margin-left 0.3s ease-in-out",
	[theme.breakpoints.down(1200)]: { marginLeft: 0 },
}));

const LayoutBodyWrapper = ({ children }: PropsWithChildren) => {
	const { sidebarCompact, handleOpenMobileSidebar } = useLayout();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

	return (
		<>
			{/* Mobile Header for Non-Workspace Paths - DISABLED to avoid duplicate top bars */}
			{/* {isMobile && (
				<Box
					sx={{
						position: "sticky",
						top: 0,
						zIndex: theme.zIndex.appBar,
						backgroundColor: "background.paper",
						borderBottom: "1px solid",
						borderColor: "divider",
						padding: "8px 16px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Box
						component="img"
						src="/static/logo/socratics-icon.png"
						alt="logo"
						width={40}
						height={40}
					/>
					<IconButton 
						onClick={handleOpenMobileSidebar}
						size="large"
						sx={{ 
							color: "text.primary",
							width: 48,
							height: 48,
							"& .MuiSvgIcon-root": {
								fontSize: 28
							}
						}}
					>
						<Menu />
					</IconButton>
				</Box>
			)} */}

			<RootBox
				compact={sidebarCompact ? 1 : 0}
				sx={{
					height: "calc(100dvh - 72px)",
					overflow: "hidden",
					minHeight: 0,
				}}
			>
				<Box
					maxWidth="100%"
					sx={{
						padding: "0px 8px !important",
						height: "100%",
						overflowY: "auto",
						minHeight: 0,
					}}
				>
					{children}
				</Box>
			</RootBox>
		</>
	);
};

export default LayoutBodyWrapper;
