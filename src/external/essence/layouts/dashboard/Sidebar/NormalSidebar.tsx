import { Box, IconButton } from "@mui/material";
// LAYOUT BASED HOOK
import useLayout from "../context/useLayout";
// CUSTOM COMPONENTS
import { Scrollbar } from "@/external/essence/components/scrollbar";
import MultiLevelMenu from "../MultiLevelMenu/MultiLevelMenu";
// CUSTOM ICON COMPONENT
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
// STYLED COMPONENTS
import { SidebarWrapper, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COMPACT } from "../../layout-parts/styles/sidebar";

// Toggle button positioning constants
const TOGGLE_BUTTON_HALF_WIDTH = 16;
const TOGGLE_MARGIN_FROM_EDGE = 24;

const DashboardSidebar = () => {
	const {
		sidebarCompact,
		handleSidebarCompactToggle: handleSidebarCompactToggleProxy,
	} = useLayout();

	const handleSidebarCompactToggle = () => {
		handleSidebarCompactToggleProxy();
	};

	// ACTIVATE COMPACT WHEN TOGGLE BUTTON CLICKED
	const COMPACT = sidebarCompact ? 1 : 0;

	// Toggle button position - stays at the sidebar edge, moves with sidebar
	const toggleButtonLeft = sidebarCompact 
		? SIDEBAR_WIDTH_COMPACT - TOGGLE_BUTTON_HALF_WIDTH - TOGGLE_MARGIN_FROM_EDGE
		: SIDEBAR_WIDTH_EXPANDED - TOGGLE_BUTTON_HALF_WIDTH - TOGGLE_MARGIN_FROM_EDGE;

	return (
		<>
			<SidebarWrapper compact={COMPACT} height={`calc(100vh - 50px)`}>
				<Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
					<Scrollbar
						sx={{
							overflowX: "hidden",
							flex: 1,
							minHeight: 0,
							height: "100%",
							pr: 0.5,
						}}
					>
						<Box height="100%" px={2} pb={4}>
							{/* NAVIGATION ITEMS */}
							<MultiLevelMenu sidebarCompact={!!COMPACT} />
						</Box>
					</Scrollbar>
				</Box>
			</SidebarWrapper>

			{/* Toggle button - positioned at sidebar edge, moves with sidebar */}
			<IconButton
				onClick={handleSidebarCompactToggle}
				size="small"
				sx={{
					position: "fixed",
					bottom: 24,
					left: toggleButtonLeft,
					zIndex: (theme) => theme.zIndex.drawer + 1,
					minWidth: 0,
					width: "auto",
					padding: "6px 8px",
					"&:hover": {
						backgroundColor: "action.hover",
					},
					// Smooth transition - same timing as sidebar for synchronized movement
					transition: "left 0.3s ease-in-out, background-color 0.2s ease",
				}}
				aria-label={sidebarCompact ? "Expand sidebar" : "Collapse sidebar"}
			>
				{sidebarCompact ? (
					<ChevronRight sx={{ fontSize: 20, color: "text.secondary" }} />
				) : (
					<ChevronLeft sx={{ fontSize: 20, color: "text.secondary" }} />
				)}
			</IconButton>
		</>
	);
};

export default DashboardSidebar;
