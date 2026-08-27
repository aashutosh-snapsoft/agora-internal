import { Box, styled } from "@mui/material";
import { Scrollbar } from "@/external/essence/components/scrollbar";
import LayoutDrawer from "../../layout-parts/LayoutDrawer";
import MultiLevelMenu from "../MultiLevelMenu/MultiLevelMenu";
import useLayout from "../context/useLayout";

// STYLED COMPONENTS
const NavWrapper = styled(Box)({
	height: "100%",
	paddingLeft: 16,
	paddingRight: 16,
});

export interface MobileSidebarProps {
	showMobile: boolean;
	handleCloseMobile: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
	showMobile,
	handleCloseMobile,
}) => {
	const { handleCloseMobileSidebar } = useLayout();

	return (
		<LayoutDrawer open={showMobile} onClose={handleCloseMobile}>
			<Scrollbar
				sx={{ overflowX: "hidden", height: "100%" }}
			>
				<NavWrapper>
					<Box
						pl={1}
						pt={3}
						alt="logo"
						maxWidth={45}
						component="img"
						src="/static/logo/socratics-icon.png"
					/>
					<MultiLevelMenu sidebarCompact={false} />
				</NavWrapper>
			</Scrollbar>
		</LayoutDrawer>
	);
};

export default MobileSidebar;
