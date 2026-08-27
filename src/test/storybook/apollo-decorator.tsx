import { ApolloProvider } from "@apollo/client";
import { StoryFn } from "@storybook/nextjs";
import { createMockApolloClient } from "../mocks/apollo-client";

export const withApollo = (mocks: any = {}) => {
	const ApolloDecorator = (Story: StoryFn) => {
		const client = createMockApolloClient(mocks);
		return (
			<ApolloProvider client={client}>
				<Story />
			</ApolloProvider>
		);
	};

	ApolloDecorator.displayName = "ApolloDecorator";
	return ApolloDecorator;
};
