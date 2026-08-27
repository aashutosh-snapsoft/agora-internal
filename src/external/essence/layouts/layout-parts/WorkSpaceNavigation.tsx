import { ReactNode, ComponentType } from "react";
import { SvgIconProps } from "@mui/material";
import {
	IconProps as PhosphorIconProps,
	ChartBar,
	Table,
	Briefcase,
	PresentationChart,
	Files,
} from "@phosphor-icons/react";

interface NavItem {
	type: string;
	name: string;
	path: string;
	label: string;
	access: string;
	iconText: string;
	disabled: boolean;
	badge?: ReactNode;
	children: Partial<NavItem>[];
	icon: (_: SvgIconProps<"svg", unknown>) => JSX.Element;
}

const createPhosphorIcon = (
	PhosphorIcon: ComponentType<PhosphorIconProps>,
	name: string
) => {
	const IconComponent = (props: SvgIconProps) => (
		<PhosphorIcon weight="duotone" size={24} {...props} />
	);

	IconComponent.displayName = `PhosphorIcon${name}`;

	return IconComponent;
};

export type Navigations = Partial<NavItem>;

/**
 * Returns the left-side navigation items for the workspace.
 *
 * @param pid - The project ID
 * @returns The navigation items
 */
export const WorkSpaceNavigations = (pid: string): Partial<NavItem>[] => {
	return [
		// {
		// 	name: "Dashboard",
		// 	path: "/dashboard",
		// 	icon: createPhosphorIcon(ChartBar, "ChartBar"),
		// 	disabled: true,
		// },
		{
			name: "Financial Model",
			path: "/projects/:pid",
			icon: createPhosphorIcon(Table, "Table"),
			disabled: false,
		},
		// {
		// 	name: "Research",
		// 	path: "/research",
		// 	icon: createPhosphorIcon(Briefcase, "Briefcase"),
		// 	disabled: true,
		// },
		// {
		// 	name: "Presentations",
		// 	path: "/presentations",
		// 	icon: createPhosphorIcon(PresentationChart, "PresentationChart"),
		// 	disabled: true,
		// },
		// {
		// 	name: "Documents",
		// 	path: `/projects/${pid}/documents`,
		// 	icon: createPhosphorIcon(Files, "Files"),
		// 	disabled: false,
		// },
	];
};
