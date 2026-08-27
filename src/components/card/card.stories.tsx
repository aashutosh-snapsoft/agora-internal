import { Meta, StoryObj } from "@storybook/nextjs";
import { Box, Divider } from "@mui/material";
import ThemeProvider from "@/external/essence/theme";
import { Card } from "./card";

const withProviders = (Story: any) => (
	<ThemeProvider>
		<Box sx={{ width: 420, p: 3 }}>
			<Story />
		</Box>
	</ThemeProvider>
);

const meta: Meta<typeof Card> = {
	title: "Components/Card",
	component: Card,
	decorators: [withProviders],
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Bordered: Story = {
	render: () => (
		<Card>
			<Box
				sx={{
					px: 2,
					height: 48,
					display: "flex",
					alignItems: "center",
					fontSize: "14px",
					fontWeight: 700,
					color: "#121017",
				}}
			>
				Card title
			</Box>
			<Divider />
			<Box sx={{ p: 2, minHeight: 120 }} />
		</Card>
	),
};
