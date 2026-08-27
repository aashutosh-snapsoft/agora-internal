import { Meta, StoryObj } from "@storybook/nextjs";
import { Stack } from "@mui/material";
import ThemeProvider from "@/external/essence/theme";
import { Button } from "./button";

const withProviders = (Story: any) => (
	<ThemeProvider>
		<Stack direction="row" spacing={2} sx={{ p: 3 }}>
			<Story />
		</Stack>
	</ThemeProvider>
);

const meta: Meta<typeof Button> = {
	title: "Components/Button",
	component: Button,
	decorators: [withProviders],
	tags: ["autodocs"],
	argTypes: {
		variant: { control: "select", options: ["primary", "secondary", "danger"] },
		disabled: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
	args: { variant: "primary", children: "Save" },
};

export const Secondary: Story = {
	args: { variant: "secondary", children: "Cancel" },
};

export const Danger: Story = {
	args: { variant: "danger", children: "Delete account" },
};

export const Disabled: Story = {
	args: { variant: "primary", children: "Save", disabled: true },
};
