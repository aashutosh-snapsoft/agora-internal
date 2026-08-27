import React from "react";
import UploadChecklist from "./CheckList";
import { Meta, StoryObj } from "@storybook/nextjs";

const meta: Meta<typeof UploadChecklist> = {
	title: "Components/Workspace UI/UploadChecklist",
	component: UploadChecklist,
};
export default meta;

type Story = StoryObj<typeof UploadChecklist>;

const uploadRequirements = [
   {
	   label: "Income statement",
	   details: "The worksheet should be named 'Income statement'.",
   },
   {
	   label: "Balance sheet",
	   details: "The worksheet should be named 'Balance sheet'.",
   },
   {
	   label: "Multiple time periods",
	   details: "Include data covering more than one period (e.g., years or months).",
   },
   {
	   label: "Time period alignment",
	   details: "Time periods should align across all statements.",
   },
];

const forecastRequirements = [
	{
		label: "Capital Expenditures",
		details: "Assumption required for building the forecast model.",
	},
	{
		label: "Accumulated Depreciation",
		details: "Missing assumption needed to complete financial forecast.",
	},
	{
		label: "Interest Expense",
		details: "Provide expected interest expense for forecasting.",
	},
	{
		label: "Income Tax Expense",
		details: "Set an estimated tax expense for accurate results.",
	},
	{
		label: "Dividends Paid",
		details: "Include dividend assumptions to finalize the model.",
	},
];

const fakeAPI =
	(shouldFail = false) =>
	async (file: File | null, label: string) => {
		console.info(`[${shouldFail ? "Failing" : "Passing"}] ${label}`, file?.name);
		await new Promise((res) => setTimeout(res, 1000));
		if (shouldFail && label.includes("Balance")) {
			throw new Error("File content not valid for Balance Sheet");
		}
		if (shouldFail && label.includes("Tax")) {
			throw new Error("Missing assumption: Income Tax Expense");
		}
	};

export const UploadModeSuccess: Story = {
	render: () => (
		<UploadChecklist
			uploadMode="manual"
			requirements={uploadRequirements}
			uploadFileToRequirementAPI={fakeAPI(false)}
		/>
	),
};

export const UploadModeFailure: Story = {
	render: () => (
		<UploadChecklist
			uploadMode="manual"
			requirements={uploadRequirements}
			uploadFileToRequirementAPI={fakeAPI(true)}
		/>
	),
};

export const AutoModeSuccess: Story = {
	render: () => (
		<UploadChecklist
			uploadMode="auto"
			requirements={forecastRequirements}
			uploadFileToRequirementAPI={fakeAPI(false)}
		/>
	),
};

export const AutoModeFailure: Story = {
	render: () => (
		<UploadChecklist
			uploadMode="auto"
			requirements={forecastRequirements}
			uploadFileToRequirementAPI={fakeAPI(true)}
		/>
	),
};
