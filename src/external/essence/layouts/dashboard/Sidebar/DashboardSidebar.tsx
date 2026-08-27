import { useAppDispatch, useAppSelector } from "@/store/store";
import { toggleChat } from "@/store/chat/chat-thunks";
import { selectChatState } from "@/store/chat/chat-selectors";
import { Box, useTheme } from "@mui/material";
import ChatIcon from "@/components/icons/Chat";
import { ChatButtonStyled } from "../../layout-parts/styles/sidebar";
import MobileSidebar from "./MobileSidebar";
import NormalSidebar from "./NormalSidebar";
import { CustomTheme } from "../../../theme/createTheme";
import useLayout from "../context/useLayout";

const TOP_HEADER_AREA = 70;

interface UnifiedSidebarProps {
	isMobile: boolean;
}

const DashboardSidebar: React.FC<UnifiedSidebarProps> = ({
	isMobile,
}) => {
	const dispatch = useAppDispatch();
	const theme = useTheme<CustomTheme>();
	const { isExpanded } = useAppSelector(selectChatState);
	const { sidebarCompact, isWorkspacePath, showMobileSidebar } = useLayout();

	return (
		<>
			{isMobile ? (
				<MobileSidebar
				    showMobileSidebar={showMobileSidebar}
				/>
			) : (
				<NormalSidebar />
			)}

			{isWorkspacePath && (
				<Box
					sx={{
						position: "fixed",
						bottom: 20,
						left: sidebarCompact ? 46 : 46,
						transform: "translateX(-50%)",
						zIndex: 2000,
						pointerEvents: "none",
						transition: "left 0.2s ease",
					}}
				>
					<Box sx={{ pointerEvents: "auto" }}>
						<ChatButtonStyled
							isExpanded={isExpanded}
							sx={{
								backgroundColor: isExpanded
									? theme.palette.grey[900]
									: (theme.palette as any).brand[500],
								color: isExpanded ? "#FFF" : theme.palette.grey[900],
							}}
							onClick={() => dispatch(toggleChat()).unwrap()}
						>
							<ChatIcon fill={isExpanded ? "#FFF" : theme.palette.grey[900]} />
						</ChatButtonStyled>
					</Box>
				</Box>
			)}
		</>
	);
};

export default DashboardSidebar;
