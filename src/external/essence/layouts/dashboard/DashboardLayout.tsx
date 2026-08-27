"use client";

import { FC, PropsWithChildren, useMemo, Suspense } from "react";
import { Box, Theme, useMediaQuery } from "@mui/material";

// CUSTOM COMPONENTS
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./Sidebar/DashboardSidebar";
import LayoutBodyWrapper from "../layout-parts/LayoutBodyWrapper";

// DASHBOARD LAYOUT BASED CONTEXT PROVIDER
import LayoutProvider from "./context/layoutContext";
import useLocation from "../../hooks/useLocation";
import { useAppSelector } from "@/store/store";
import {
	selectProjects,
	selectCurrentProject,
} from "@/store/projects/project-selectors";
import { BreadcrumbState } from "./BreadcrumbNavigation";
import TableSkeletonLoader from "@/components/table-loader/table-loader";

const DashboardLayout: FC<PropsWithChildren> = ({ children }) => {
	// const downLg = useMediaQuery((theme: Theme) => theme.breakpoints.down("lg"));
	const downLg = useMediaQuery((theme: Theme) => theme.breakpoints.down("lg"), {
		noSsr: true,
	});
	const { pathname } = useLocation();
	const projects = useAppSelector(selectProjects);
	const project = useAppSelector(selectCurrentProject);
	// const { handleOpenMobileSidebar } = useLayout();

	const isWorkspacePath = useMemo(
		() =>
			pathname !== null &&
			pathname.startsWith("/projects/") &&
			pathname !== "/projects",
		[pathname]
	);

	// /projects itself (the projects list + upload flow, promoted from the
	// former demo-staging route — see ProjectsWorkspace) brings its own page
	// chrome (title, grid, intake screen) — suppress the global Projects/Support
	// sidebar and render full-bleed, same treatment the demo control page used
	// to get. isWorkspacePath (above) deliberately excludes exact "/projects",
	// so this is the complementary case.
	const isProjectsHomePath = useMemo(
		() => pathname === "/projects",
		[pathname]
	);

	// Routes that use the NEW app shell — the ProjectsSidebar rail, no top
	// DashboardHeader, no old Projects/Support DashboardSidebar, full-bleed.
	// /projects home and /profile both opt in; each page renders its own
	// ProjectsSidebar (see ProjectsWorkspace / profile page).
	const isNewShellPath = useMemo(
		() => isProjectsHomePath || pathname === "/profile",
		[isProjectsHomePath, pathname]
	);

	const projectId = useMemo(() => {
		if (!isWorkspacePath) return null;

		try {
			const parts = pathname?.split("/projects/") ?? [];
			if (parts.length < 2) return null;

			const projectSegment = parts[1].split("/");
			if (!projectSegment[0]) return null;

			return projectSegment[0];
		} catch (error) {
			console.error("Error parsing project ID from URL:", error);
			return null;
		}
	}, [isWorkspacePath, pathname]);

	const projectName = useMemo(
		() =>
			project?.name ??
			projects.find((project) => project.id === projectId)?.name ??
			"Project",
		[project?.name, projects, projectId]
	);

	const breadcrumbState = useMemo(() => {
		if (pathname?.includes("/dashboard")) {
			return BreadcrumbState.Dashboard;
		}
		if (pathname?.includes("/research")) {
			return BreadcrumbState.Research;
		}
		if (pathname?.includes("/presentation")) {
			return BreadcrumbState.Presentation;
		}
		if (pathname?.includes("/documents")) {
			return BreadcrumbState.Documents;
		}
		return BreadcrumbState.FinancialModel;
	}, [pathname]);


	// if (isLoading) {
	// 	return <LoaderWithLogo />;
	// }

	// if (!isAuthenticated) {
	// 	return (
	// 		<LayoutProvider>
	// 			<LayoutBodyWrapper>{children}</LayoutBodyWrapper>
	// 		</LayoutProvider>
	// 	);
	// }

	return (
		<LayoutProvider>
			{/* Header shows on all authenticated routes EXCEPT the new-shell routes
			    (/projects home and /profile), which render their own chrome and the
			    ProjectsSidebar rail instead (see isNewShellPath). */}
			{!isNewShellPath && (
				<DashboardHeader
					projectId={projectId}
					projectName={projectName}
					breadcrumbState={breadcrumbState}
					isProjectLoading={false}
					appLocation={isWorkspacePath ? "workspace" : "homebase"}
					// handleOpenMobileSidebar={handleOpenMobileSidebar}
				/>
			)}
			{!isNewShellPath && <DashboardSidebar isMobile={downLg} />}
			{isWorkspacePath || isNewShellPath ? (
				<Box
					sx={{
						overflow: "hidden",
					}}
				>
					<Suspense fallback={<TableSkeletonLoader />}>
						{children}
					</Suspense>
				</Box>
			) : (
				<LayoutBodyWrapper>
					{/* MAIN CONTENT RENDER SECTION */}
					<Suspense fallback={<TableSkeletonLoader />}>
						{children}
					</Suspense>
				</LayoutBodyWrapper>
			)}
		</LayoutProvider>
	);
};

export default DashboardLayout;
