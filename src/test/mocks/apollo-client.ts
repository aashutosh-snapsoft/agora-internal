import {
	ApolloClient,
	InMemoryCache,
	ApolloLink,
	Operation,
	Observable,
} from "@apollo/client";

// Helper to create a mock client with specific mocks
export const createMockApolloClient = (mocks: any = {}) => {
	// Custom link to intercept operations
	const mockLink = new ApolloLink((operation: Operation) => {
		const { operationName } = operation;

		// Return mocked data based on operation name
		return new Observable((observer: any) => {
			const mockData = mocks[operationName];
			if (mockData) {
				observer.next({ data: mockData });
				observer.complete();
			} else {
				observer.error(
					new Error(`No mock defined for operation: ${operationName}`)
				);
			}
		});
	});

	return new ApolloClient({
		cache: new InMemoryCache(),
		link: mockLink,
	});
};
