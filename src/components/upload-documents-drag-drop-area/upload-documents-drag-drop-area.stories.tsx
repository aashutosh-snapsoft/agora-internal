import UploadDocumentsDragDropArea from "./upload-documents-drag-drop-area";
import { Meta, StoryObj } from "@storybook/nextjs";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ThemeProvider from "@/external/essence/theme";
import { withRouter } from "@/test/storybook/router-decorator";
import { withApollo } from "@/test/storybook/apollo-decorator";
import StyledUploadDocumentsDragDropArea from "./upload-documents-drag-drop-area";

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

const meta: Meta<typeof StyledUploadDocumentsDragDropArea> = {
	title: "Components/Workspace UI/UploadDocumentsDragDropArea",
	component: StyledUploadDocumentsDragDropArea,
	decorators: [withProviders, withRouter, withApollo({})],
	tags: ["autodocs"],
	argTypes: {},
};

export default meta;

type Story = StoryObj<typeof StyledUploadDocumentsDragDropArea>;

export const Default: Story = {
	name: "default",
	args: {},
};
