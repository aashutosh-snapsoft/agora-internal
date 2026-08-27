import { Meta, StoryObj } from "@storybook/nextjs";
import ThemeProvider from "@/external/essence/theme";
import AppHealthOverlay from "./AppHealthOverlay";
import { AppHealthState } from "@/lib/health-controller";

const withProviders = (Story: any) => (
	<ThemeProvider>
		<Story />
	</ThemeProvider>
);

const meta: Meta<typeof AppHealthOverlay> = {
	title: "Components/App Health/AppHealthOverlay",
	component: AppHealthOverlay,
	decorators: [withProviders],
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	argTypes: {
		state: {
			control: { type: "select" },
			options: ["offline", "degraded", "hard_recovering"] as AppHealthState[],
			description: "The current health state of the application",
		},
	},
};

export default meta;

type Story = StoryObj<typeof AppHealthOverlay>;

export const Offline: Story = {
	name: "Offline",
	args: {
		state: "offline",
	},
	parameters: {
		docs: {
			description: {
				story: "Shown when the browser detects no network connectivity. Includes a 'Try Again' button to reload the page.",
			},
		},
	},
};

export const Degraded: Story = {
	name: "Degraded",
	args: {
		state: "degraded",
	},
	parameters: {
		docs: {
			description: {
				story: "Shown when the application encounters temporary failures. Automatically retries with exponential backoff.",
			},
		},
	},
};

export const HardRecovering: Story = {
	name: "Hard Recovering",
	args: {
		state: "hard_recovering",
	},
	parameters: {
		docs: {
			description: {
				story: "Shown when browser state is corrupted and a full reset is needed.",
			},
		},
	},
};
