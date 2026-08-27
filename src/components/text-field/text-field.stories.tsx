import { Meta, StoryObj } from "@storybook/nextjs";
import { Box } from "@mui/material";
import ThemeProvider from "@/external/essence/theme";
import { TextField } from "./text-field";

const withProviders = (Story: any) => (
	<ThemeProvider>
		<Box sx={{ width: 320, p: 3 }}>
			<Story />
		</Box>
	</ThemeProvider>
);

const meta: Meta<typeof TextField> = {
	title: "Components/Text Field",
	component: TextField,
	decorators: [withProviders],
	tags: ["autodocs"],
	argTypes: {
		label: { control: "text" },
		helperText: { control: "text" },
		placeholder: { control: "text" },
		required: { control: "boolean" },
		optional: { control: "boolean" },
		error: { control: "boolean" },
		disabled: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {
	args: { label: "Label", placeholder: "Text" },
};

export const Filled: Story = {
	args: { label: "First Name", defaultValue: "Marina" },
};

export const Required: Story = {
	args: { label: "First Name", required: true, placeholder: "Text" },
};

export const Optional: Story = {
	args: { label: "Job Title", optional: true, placeholder: "Text" },
};

export const WithHelperText: Story = {
	args: {
		label: "Email",
		defaultValue: "marina@socratics.dev",
		helperText: "Managed by your login — contact an admin to change it.",
	},
};

export const ErrorState: Story = {
	args: {
		label: "First Name",
		defaultValue: "Ma",
		error: true,
		helperText: "Must be greater than 3 characters",
	},
};

export const Disabled: Story = {
	args: { label: "Organization", defaultValue: "Socratics", disabled: true },
};
