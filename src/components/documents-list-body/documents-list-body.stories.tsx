import DocumentsListBody from "./documents-list-body";
import { Meta, StoryObj } from "@storybook/nextjs";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ThemeProvider from "@/external/essence/theme";
import { withRouter } from "@/test/storybook/router-decorator";
import { withApollo } from "@/test/storybook/apollo-decorator";
import StyledDocumentsListBody from "./documents-list-body";
import { DocumentType, DocumentSource } from "@/types/documents";

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

const meta: Meta<typeof StyledDocumentsListBody> = {
	title: "Components/Workspace UI/DocumentsListBody",
	component: StyledDocumentsListBody,
	decorators: [withProviders, withRouter, withApollo({})],
	tags: ["autodocs"],
	argTypes: {},
};

export default meta;

type Story = StoryObj<typeof StyledDocumentsListBody>;

export const Default: Story = {
	name: "default",
	args: {
		documents: [
			{
				id: "1243",
				type: "excel" as DocumentType,
				storage_url: "https://storage.googleapis.com/...",
				source: "storage_url" as DocumentSource,
				filename: "Yoshi Taxonomy _ Aug 2024.xlsx",
				state: "ingested",
				details: "Ingestion completed",
				mimetype:
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				metadata: {
					validation: [
						{
							title: "File format validation",
							status: "pass",
							details: "Excel file format is valid",
						},
						{
							title: "Data structure validation",
							status: "pass",
							details: "All required columns are present",
						},
					],
				},
				updated_at: "2025-01-24T13:40:33.729311+00:00",
				created_at: "2025-01-24T13:40:32.214799+00:00",
				__typename: "documents",
			},
		],
		setAnchorEl: () => {},
		setSelectedDocuemnt: () => {},
	},
};
