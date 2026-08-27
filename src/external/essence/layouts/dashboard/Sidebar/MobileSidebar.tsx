import { Box, styled, IconButton } from "@mui/material";
import { Scrollbar } from "@/external/essence/components/scrollbar";
import LayoutDrawer from "../../layout-parts/LayoutDrawer";
import MultiLevelMenu from "../MultiLevelMenu/MultiLevelMenu";
import useLayout from "../context/useLayout";
import CloseIcon from "@mui/icons-material/Close"; 

// STYLED COMPONENTS
const NavWrapper = styled(Box)({
	height: "100%",
	paddingLeft: 16,
	paddingRight: 16,
});

export interface MobileSidebarProps {
	showMobileSidebar: boolean;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
	showMobileSidebar,
}) => {
	const { handleCloseMobileSidebar } = useLayout();

	return (
		<LayoutDrawer open={showMobileSidebar} onClose={handleCloseMobileSidebar}>
			<Box
				sx={{
					mt: 2,
					display: "flex",
					flexDirection: "column",
					height: "100%",
					position: "relative",
					// backgroundColor: "red",

				}}
			>
				<IconButton
					onClick={handleCloseMobileSidebar}
					sx={{
						position: "absolute",
						top: 0,
						right: 2,
						zIndex: 10,
					}}
					size="large"
				>
					<CloseIcon />
				</IconButton>

				<Scrollbar
					sx={{
						overflowX: "hidden",
						flex: "1 1 auto",
						width: "90%",
					}}
				>
					<NavWrapper>
						{/* Logo removed from mobile sidebar */}
						<MultiLevelMenu sidebarCompact={false} />
					</NavWrapper>
				</Scrollbar>

				<Box
					sx={{
						p: 2,
						display: "flex",
						justifyContent: "center",
						flexShrink: 0,
					}}
				></Box>
			</Box>
		</LayoutDrawer>
	);
};

export default MobileSidebar;
