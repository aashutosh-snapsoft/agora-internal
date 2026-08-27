// MultiLevelMenu.tsx
import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import useNavigate from "@/external/essence/hooks/useNavigate";
import useLocation from "@/external/essence/hooks/useLocation";
import { Tooltip } from "@mui/material";
import { Box } from "@mui/system";
import useLayout from "../context/useLayout";
import SidebarAccordion from "../SidebarAccordion";
import { navigations, Navigations } from "../../layout-parts/navigation";
import { WorkSpaceNavigations } from "../../layout-parts/WorkSpaceNavigation";
import {
	ItemText,
	ListLabel,
	BulletIcon,
	ICON_STYLE,
	NavItemButton,
} from "../../layout-parts/styles/sidebar";
import { StyledNavItemButton } from "../../layout-parts/styles/header";
import { useAppSelector } from "@/store/store";
import { projectSelector } from "@/store/projects/project-selectors";
import { selectCurrentRole } from "@/store/auth/auth-selector";
import { MultiLevelMenuProps } from "./MultiLevelMenu.types";
import { activeRoute } from "./MultiLevelMenu.utils";

/**
 * MultiLevelMenu is a component that displays a multi-level menu of navigation items.
 * It is used to navigate through the application.
 * @param sidebarCompact - Whether the sidebar is compact.
 * @returns A component that displays a multi-level menu of navigation items.
 */
const MultiLevelMenu: FC<MultiLevelMenuProps> = ({ sidebarCompact }) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { handleCloseMobile, isWorkspacePath } = useLayout();
	const { project } = useAppSelector(projectSelector);
	const currentRole = useAppSelector(selectCurrentRole);
	const isActiveRoute = activeRoute(pathname!);

	// HANDLE NAVIGATE TO ANOTHER PAGE
	const handleNavigation = (path: string) => {
		navigate(path);
		handleCloseMobile?.();
	};

	// ACTIVATE SIDEBAR COMPACT
	const COMPACT = sidebarCompact ? 1 : 0;

	// RECURSIVE FUNCTION TO RENDER MULTI LEVEL MENU
	const renderLevels = (data: Navigations[]) => {
		return data.map((item: Navigations, index: number) => {
			// MENU LABEL DESIGN
			if (item.type === "label") {
				return (
					<ListLabel key={index} compact={COMPACT}>
						{t(item.label!)}
					</ListLabel>
				);
			}

			// MENU LIST WITH CHILDREN
			if (item.children) {
				return (
					<SidebarAccordion key={index} item={item} sidebarCompact={COMPACT}>
						{renderLevels(item.children)}
					</SidebarAccordion>
				);
			}

			return isWorkspacePath ? (
				<StyledNavItemButton
					key={index}
					disabled={item.disabled}
					active={isActiveRoute(item.path!)}
					onClick={() => handleNavigation(item.path!)}
					sx={{
						cursor: item.disabled ? "not-allowed" : "pointer",
						"&.Mui-disabled": {
							cursor: "not-allowed",
							pointerEvents: "all",
						},
					}}
				>
					{item?.icon ? (
						<Tooltip key={index} title={t(item.name!)} placement="right" arrow>
							<Box display="flex" justifyContent="center">
								<item.icon sx={ICON_STYLE(isActiveRoute(item.path!))} />
							</Box>
						</Tooltip>
					) : (
						<></>
					)}

					<ItemText compact={COMPACT} active={isActiveRoute(item.path!)}>
						{t(item.name!)}
					</ItemText>
				</StyledNavItemButton>
			) : (
				<NavItemButton
					key={index}
					disabled={item.disabled}
					active={isActiveRoute(item.path!)}
					onClick={() => handleNavigation(item.path!)}
					sx={{
						cursor: item.disabled ? "not-allowed" : "pointer",
						"&.Mui-disabled": {
							cursor: "not-allowed",
							pointerEvents: "all",
						},
					}}
				>
					{item?.icon ? (
						COMPACT ? (
							<Tooltip title={t(item.name!)} placement="right" arrow enterDelay={3000} enterNextDelay={3000}>
								<item.icon sx={ICON_STYLE(isActiveRoute(item.path!))} />
							</Tooltip>
						) : (
							<item.icon sx={ICON_STYLE(isActiveRoute(item.path!))} />
						)
					) : (
						<BulletIcon active={isActiveRoute(item.path!)} />
					)}

					<ItemText compact={COMPACT} active={isActiveRoute(item.path!)}>
						{t(item.name!)}
					</ItemText>
				</NavItemButton>
			);
		});
	};

	// USER ROLE BASED ON FILTER NAVIGATION
	const filterNavigation = useMemo(() => {
		return navigations.filter((navigation) => {
			if (!navigation.access) return true;
			else if (navigation.access === currentRole) return true;
			else return false;
		});
	}, [currentRole]);

	const updatedWorkspaceNavigations = useMemo(() => {
		return WorkSpaceNavigations(project?.id as string).map((navigation) => {
			if (navigation.path === "/projects/:pid") {
				if (!project?.id) {
					const currentPath = window.location.href;
					const pid = currentPath.split("/").pop();
					return {
						...navigation,
						path: `/projects/${pid}`,
					};
				}
				return {
					...navigation,
					path: `/projects/${project?.id}`,
				};
			}

			return navigation;
		});
	}, [project?.id]);

	const navigationItems = useMemo(() => {
		if (!isWorkspacePath) {
			return filterNavigation;
		}

		const workspaceSection: Navigations[] =
			updatedWorkspaceNavigations.length > 0
				? [{ type: "label", label: "Workspace" }, ...updatedWorkspaceNavigations]
				: [];

		return [...filterNavigation, ...workspaceSection];
	}, [filterNavigation, isWorkspacePath, updatedWorkspaceNavigations]);

	return <>{renderLevels(navigationItems)}</>;
};

export default MultiLevelMenu;
