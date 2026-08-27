import { FC, useEffect } from "react";
import { useMediaQuery } from "@mui/material";
import { Box, IconButton, Theme } from "@mui/material";
import {
	DashboardHeaderRoot,
	StyledToolBar,
} from "../layout-parts/styles/header";
import BreadcrumbNavigation, { BreadcrumbState } from "./BreadcrumbNavigation";
import TeamMembers from "./TeamMembers";
import ProfilePopover from "../layout-parts/popovers/ProfilePopover";
import Link from "next/link";
import Menu from "@/external/essence/icons/Menu";
import useLayout from "./context/useLayout";

interface DashboardHeaderProps {
	// The ID of the currently selected project.
	projectId: string | null;
	// The name of the currently selected project.
	projectName: string | null;
	// Set to true if and only if a project has been selected.
	// When this is true, both `projectId` and `projectName` is available.
	// Otherwise, it is null.
	isProjectLoading: boolean;

	appLocation: "homebase" | "workspace";

	// The state of the breadcrumb navigation.
	breadcrumbState: BreadcrumbState;

}

/**
 * This component is the dashboard header for both workspace and homebase UI,
 * which contains the Socratics AI logo, project context (when available),
 * breadcrumbs (when in workspace), team members (when in workspace),
 * and the profile popover (always visible for consistent user access).
 */
const DashboardHeader: FC<DashboardHeaderProps> = ({
	projectId,
	projectName,
	isProjectLoading,
	breadcrumbState,
	appLocation,
}) => {
	const downMd = useMediaQuery((theme: Theme) => theme.breakpoints.down(1200));

	const { handleOpenMobileSidebar } = useLayout();

	return (
		<DashboardHeaderRoot position="sticky">
			<StyledToolBar>
				{/* Mobile Menu Button */}
				{downMd && (
					<IconButton onClick={handleOpenMobileSidebar} size="large">
						<Menu />
					</IconButton>
				)}

				{/* Company Logo - Always show */}
				<Link href="/">
					<Box
						component="img"
						src="/static/logo/socratics-icon.png"
						alt="logo"
						width={40}
					/>
				</Link>

				{/* Breadcrumb Navigation - Only show when in workspace with project context */}
				{appLocation === "workspace" && projectId !== null && projectName !== null && (
					<BreadcrumbNavigation
						state={breadcrumbState}
						projectId={projectId}
						projectName={projectName}
					/>
				)}

				<Box flexGrow={1} />

				{/* Team Members - Only show in workspace */}
				{/* {appLocation === "workspace" && <TeamMembers />} */}
				
				{/* Profile Popover - Always show for consistent user access */}
				<ProfilePopover />
			</StyledToolBar>
		</DashboardHeaderRoot>
	);
};

export default DashboardHeader;
