"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Context = { pid?: string; fid?: string };
// eslint-disable-next-line no-unused-vars
type Tab = { href: string | ((context: Context) => string); label: string };

const Subheader = () => {
	const pathname = usePathname();

	if (!pathname) return null;

	const isProjects = pathname.includes("projects");
	const isFinancialModel = isProjects && pathname.includes("financials");
	const isDashboard = pathname === "/";

	const financialModelTabs: Tab[] = [];

	const dashboardTabs: Tab[] = [
		{ href: "/metrics", label: "Metrics" },
		{ href: "/reports", label: "Reports" },
	];

	const projectTabs: Tab[] = [
		{
			href: (context: Context) => `/projects/${context.pid}/financials`,
			label: "Financials",
		},
		{
			href: (context: Context) => `/projects/${context.pid}/documents`,
			label: "Documents",
		},
	];

	const tabs = isFinancialModel
		? financialModelTabs
		: isDashboard
		? dashboardTabs
		: isProjects
		? projectTabs
		: [];

	const context: Context = {};

	if (isProjects) {
		// Get the parameter(2) after projects(1)
		context.pid = pathname.split("/")[2];
	}

	if (isFinancialModel) {
		// Get the parameter(4) after financials(3)
		context.fid = pathname.split("/")[4];
	}

	if (context.fid !== undefined) {
		financialModelTabs.push({
			href: (context: Context) =>
				`/projects/${context.pid}/financials/${context.fid}`,
			label: "Financials",
		});
		financialModelTabs.push({
			href: (context: Context) =>
				`/projects/${context.pid}/financials/${context.fid}/plan`,
			label: "Plan",
		});
		financialModelTabs.push({
			href: (context: Context) =>
				`/projects/${context.pid}/financials/${context.fid}/scenarios`,
			label: "Scenarios",
		});
		financialModelTabs.push({
			href: (context: Context) =>
				`/projects/${context.pid}/financials/${context.fid}/valuation`,
			label: "Valuation",
		});
	}

	if ((!isFinancialModel && !isDashboard && !isProjects) || tabs.length === 0) {
		return null;
	}

	return (
		<nav className="flex items-center space-x-4 px-6 py-2 bg-white border-b">
			{tabs.map((tab) => (
				<NavItem
					key={typeof tab.href === "function" ? tab.href(context) : tab.href}
					href={typeof tab.href === "function" ? tab.href(context) : tab.href}
					label={tab.label}
					active={pathname === tab.href}
				/>
			))}
			<div className="flex-grow"></div>
		</nav>
	);
};

const NavItem = ({
	href,
	label,
	active = false,
}: {
	href: string;
	label: string;
	active: boolean;
}) => (
	<Link
		href={href}
		className={`text-sm ${
			active ? "font-semibold border-b-2 border-black" : "text-gray-600"
		}`}
	>
		{label}
	</Link>
);

export default Subheader;
