import TemplateName from "./templatename";
import { Meta, StoryObj } from "@storybook/nextjs";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ThemeProvider from "@/external/essence/theme";
import { withRouter } from "@/test/storybook/router-decorator";
import { withApollo } from "@/test/storybook/apollo-decorator";
import StyledTemplateName from "./templatename";

const initialState = {
	chat: {},
	auth: {},
	project: {},
	upload: {},
	onboardingChat: {},
};

const rootReducer = {
	chat: (state = initialState.chat) => state,
	auth: (state = initialState.auth) => state,
	project: (state = initialState.project) => state,
	upload: (state = initialState.upload) => state,
	onboardingChat: (state = initialState.onboardingChat) => state,
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

const meta: Meta<typeof StyledTemplateName> = {
	title: "Components/Workspace UI/TemplateName",
	component: StyledTemplateName,
	decorators: [withProviders, withRouter, withApollo({})],
	tags: ["autodocs"],
	argTypes: {},
};

export default meta;

type Story = StoryObj<typeof StyledTemplateName>;

export const Default: Story = {
	name: "default",
	args: {},
};
