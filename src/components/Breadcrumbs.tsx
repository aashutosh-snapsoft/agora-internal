// OLD-DELETE-LATER


// "use client";

// import { projectSelector } from "@/store/projects/project-selectors";
// import { fetchProjects } from "@/store/projects/project-thunks";
// import { useAppDispatch, useAppSelector } from "@/store/store";
// import Link from "next/link";

// import { usePathname } from "next/navigation";
// import { useEffect } from "react";
// import { FC } from "react";

// type BreadcrumbsProps = {
// 	projectId: string;
// };

// const Breadcrumbs: FC<BreadcrumbsProps> = ({ projectId }) => {
// 	const pathname = usePathname();
// 	const dispatch = useAppDispatch();
// 	const { projects, loading, project } = useAppSelector(projectSelector);
// 	const companyName = project?.name ?? "";

// 	useEffect(() => {
// 		dispatch(fetchProjects());
// 	}, [dispatch]);

// 	if (loading) {
// 		return (
// 			<nav className="text-sm text-gray-500">
// 				<ol className="flex items-center space-x-2">
// 					<li className="font-medium text-sm text-gray-500">
// 						<Link href="/">{companyName}</Link>
// 					</li>
// 					<li className="w-6 h-6 bg-gray-100 animate-pulse rounded-full"></li>
// 					<li className="w-32 h-6 bg-gray-100 animate-pulse rounded"></li>
// 					<li className="w-6 h-6 bg-gray-100 animate-pulse rounded-full"></li>
// 					<li className="w-40 h-6 bg-gray-100 animate-pulse rounded"></li>
// 				</ol>
// 			</nav>
// 		);
// 	}

// 	const breadcrumbMap: Record<string, string | ((segment: string) => string)> =
// 		{
// 			"/": companyName,
// 			"/dashboard": "Dashboard",
// 			"/dashboard/overview": "Overview",
// 			"/dashboard/metrics": "Metrics",
// 			"/dashboard/reports": "Reports",
// 			"/projects": "Projects",
// 			"/projects/": (id: any) => projects[id].name as string,
// 			"/organization": "Organization",
// 			"/chat": "Financial Chat",
// 			"/financial-model": "Financial Model",
// 			"/financial-model/financials": "Financials",
// 			"/financial-model/plan": "Plan",
// 			"/financial-model/scenarios": "Scenarios",
// 			"/financial-model/valuation": "Valuation",
// 		};

// 	// For each project, add a breadcrumb for the project name
// 	Object.keys(loading).forEach((key) => {
// 		const value = projects[key as any];
// 		breadcrumbMap[`/projects/${value.id}`] = value.name as string;
// 	});

// 	// For each project, add a breadcrumb for the project name
// 	Object.keys(projects).forEach((key) => {
// 		const value = projects[key as any];
// 		breadcrumbMap[`/projects/${value.id}/financials`] = "Financial Model";
// 	});

// 	// For each project, add a breadcrumb for the project name
// 	Object.keys(projects).forEach((key) => {
// 		const value = projects[key as any];
// 		breadcrumbMap[`/projects/${value.id}/documents`] = "Documents";
// 	});

// 	const generateBreadcrumbs = (path: string) => {
// 		const segments = path.split("/").filter((segment) => segment !== "");
// 		let currentPath = "";

// 		return segments.reduce(
// 			(acc, segment) => {
// 				currentPath += `/${segment}`;

// 				if (breadcrumbMap[currentPath]) {
// 					acc.push({ href: currentPath, label: breadcrumbMap[currentPath] });
// 				}
// 				return acc;
// 			},
// 			[{ href: "/", label: breadcrumbMap["/"] }]
// 		);
// 	};

// 	const breadcrumbs = generateBreadcrumbs(pathname ?? "");

// 	return (
// 		<nav className="text-sm text-gray-500">
// 			<ol className="flex items-center space-x-2">
// 				{breadcrumbs.map((crumb, index) => (
// 					<li key={crumb.href}>
// 						{index > 0 && <span className="mx-2">/</span>}
// 						<Link
// 							href={crumb.href}
// 							className={
// 								index === breadcrumbs.length - 1
// 									? "font-medium text-gray-900"
// 									: ""
// 							}
// 						>
// 							{typeof crumb.label === "function"
// 								? crumb.label(crumb.href)
// 								: crumb.label}
// 						</Link>
// 					</li>
// 				))}
// 			</ol>
// 		</nav>
// 	);
// };

// export default Breadcrumbs;
