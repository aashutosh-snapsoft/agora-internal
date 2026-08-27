import type { Meta, StoryObj } from "@storybook/nextjs";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { withApollo } from "@/test/storybook/apollo-decorator";
import ThemeProvider from "@/external/essence/theme";
import { withRouter } from "@/test/storybook/router-decorator";

import { useState } from "react";
import MobileSidebar from "./MobileSidebar";

const initialState = {
	chat: {},
	auth: {},
	project: {},
};

const rootReducer = {
	chat: (state = initialState.chat) => state,
	auth: (state = initialState.auth) => state,
	project: (state = initialState.project) => state,
};

const mockStore = configureStore({
	reducer: rootReducer,
	preloadedState: initialState,
});

const withProviders = (Story: any) => (
	<Provider store={mockStore}>
		<ThemeProvider>
			<Story />
		</ThemeProvider>
	</Provider>
);

const meta: Meta<typeof MobileSidebar> = {
	title: "Components/Workspace UI/Layout/Sidebar/MobileSidebar",
	component: MobileSidebar,
	parameters: {
		layout: "centered",
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/projects/test-project-id",
				query: {},
			},
		},
	},
	decorators: [withProviders, withRouter, withApollo({})],
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MobileSidebar>;

export const Default: Story = {
	render: (args) => {
		const [showMobile, setshowMobile] = useState(true);
		return (
			<MobileSidebar
				showMobile={showMobile}
				handleCloseMobile={() => setshowMobile(false)}
			/>
		);
	},
	args: {
		showMobile: true,
	},
};
