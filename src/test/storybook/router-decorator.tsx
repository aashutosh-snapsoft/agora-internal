import { NextRouter } from "next/router";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";

const mockRouter: NextRouter = {
	route: "/",
	pathname: "/",
	query: {},
	asPath: "/",
	basePath: "",
	isLocaleDomain: false,
	push: async () => true,
	replace: async () => true,
	reload: () => null,
	back: () => null,
	forward: () => null,
	prefetch: async () => undefined,
	beforePopState: () => null,
	events: {
		on: () => null,
		off: () => null,
		emit: () => null,
	},
	isFallback: false,
	isReady: true,
	isPreview: false,
};

export const withRouter = (Story: any) => (
	<RouterContext.Provider value={mockRouter}>
		<Story />
	</RouterContext.Provider>
);
