import React from "react";
import UploadChecklist from "./UploadCheckList";
import { Meta, StoryObj } from "@storybook/nextjs";

const meta: Meta<typeof UploadChecklist> = {
	title: "Components/Workspace UI/UploadChecklist",
	component: UploadChecklist,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A checklist component that handles file uploads and validation requirements.",
			},
		},
	},
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

// Mock function to simulate file upload API
const mockUpload = async (file: File) => {
	await new Promise((resolve) => setTimeout(resolve, 1000));
	console.info("File uploaded:", file?.name);
};

export const DefaultState: Story = {
	args: {
		requirements: uploadRequirements,
		onUpload: mockUpload,
		isProcessing: false,
	},
	parameters: {
		docs: {
			description: {
				story: "Default state of the checklist showing upload requirements.",
			},
		},
	},
};

export const ProcessingState: Story = {
	args: {
		requirements: uploadRequirements,
		onUpload: mockUpload,
		isProcessing: true,
	},
	parameters: {
		docs: {
			description: {
				story: "Shows the checklist while processing a file upload.",
			},
		},
	},
};

export const WithInitialStatuses: Story = {
	args: {
		requirements: uploadRequirements,
		onUpload: mockUpload,
		isProcessing: false,
		initialStatuses: ["success", "success", "error", "default", "default"],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Checklist with some items already processed, showing mixed statuses.",
			},
		},
	},
};

export const ForecastRequirements: Story = {
	args: {
		requirements: forecastRequirements,
		onUpload: mockUpload,
		isProcessing: false,
	},
	parameters: {
		docs: {
			description: {
				story: "Checklist showing forecast model requirements.",
			},
		},
	},
};
