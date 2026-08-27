import { Typography } from "@mui/material";
import Link from "next/link";

import { StyledBreadCrumbs } from "@/external/essence/layouts/layout-parts/styles/header";

// Define props interface
interface BreadcrumbNavigationProps {
	state?: BreadcrumbState;
	projectId: string;
	projectName: string;
}

/**
 * Currently, the breadcrumbs can only be viewed in the Financial Modeling workspace.
 *
 * Given that, the various states that the breadcrumb can use are the following:
 *
 * Dashboard
 * Financial Model
 * Research
 * Presentation
 * Documents
 *
 * Note that you must have a specific project selected to view the breadcrumbs.
 *
 * Reference: https://www.figma.com/design/H816rUjbZQRu6k3Gk5vGVi/Socratics-Agora?node-id=106-74928&node-type=canvas&t=UheiGeBz0dQFyhY3-0
 */
export enum BreadcrumbState {
	Dashboard,
	FinancialModel,
	Research,
	Presentation,
	Documents,
}

/**
 * This component is used on the Socratics.AI platform to display the
 * breadcrumb navigation for the dashboard on the financial modeling workspace.
 *
 * @param props - The props for the component.
 * @returns The component.
 */
const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
	state,
	projectId,
	projectName,
}) => {
	const handleClick = (projectId?: string) => {
		// onBreadcrumbClick?.(path);  // Optional chaining for callback
	};

	const WorkspaceSubpath = (state: BreadcrumbState) => {
		switch (state) {
			case BreadcrumbState.Dashboard:
				return "Dashboard";
			case BreadcrumbState.FinancialModel:
				return "Financial Model";
			case BreadcrumbState.Research:
				return "Research";
			case BreadcrumbState.Presentation:
				return "Presentation";
			case BreadcrumbState.Documents:
				return "Documents";
		}
	};

	return (
		<StyledBreadCrumbs
			separator="•"
			aria-label="breadcrumb"
			sx={{
				border: "none",
				"& .MuiBreadcrumbs-separator": {
					mx: 1.5, // This adds theme spacing of 1.5 between items
				},
			}}
		>
			<Link
				href={`/projects/${projectId}`}
				onClick={() => handleClick(projectId)}
			>
				<Typography
					color="text.primary"
					fontWeight="medium"
					sx={{ border: "none" }}
				>
					{projectName || ""}
				</Typography>
			</Link>
			{state && (
				<Typography color="text.primary" fontWeight="medium">
					{WorkspaceSubpath(state)}
				</Typography>
			)}
		</StyledBreadCrumbs>
	);
};

export default BreadcrumbNavigation;

export { BreadcrumbNavigation };
