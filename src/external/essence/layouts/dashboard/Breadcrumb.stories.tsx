import type { Meta, StoryObj } from "@storybook/nextjs";
import { BreadcrumbNavigation } from "./BreadcrumbNavigation";
import { BreadcrumbState } from "./BreadcrumbNavigation";
const meta: Meta<typeof BreadcrumbNavigation> = {
	title: "Dashboard/BreadcrumbNavigation",
	component: BreadcrumbNavigation,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BreadcrumbNavigation>;

export const Dashboard: Story = {
	args: {
		state: BreadcrumbState.Dashboard,
		projectId: "6c0c3381-7460-5705-ab03-27ee716e551f",
		projectName: "Acellent Technologies",
	},
};

export const FinancialModel: Story = {
	args: {
		state: BreadcrumbState.FinancialModel,
		projectId: "6c0c3381-7460-5705-ab03-27ee716e551f",
		projectName: "Acellent Technologies",
	},
};

export const Research: Story = {
	args: {
		state: BreadcrumbState.Research,
		projectId: "6c0c3381-7460-5705-ab03-27ee716e551f",
		projectName: "Acellent Technologies",
	},
};

export const Presentation: Story = {
	args: {
		state: BreadcrumbState.Presentation,
		projectId: "6c0c3381-7460-5705-ab03-27ee716e551f",
		projectName: "Acellent Technologies",
	},
};

export const Documents: Story = {
	args: {
		state: BreadcrumbState.Documents,
		projectId: "6c0c3381-7460-5705-ab03-27ee716e551f",
		projectName: "Acellent Technologies",
	},
};
