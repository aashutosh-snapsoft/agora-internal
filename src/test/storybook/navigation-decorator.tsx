import {
	PathnameContext,
	PathParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import React from "react";

const mockPathname = "/projects/1";
export const withPathname = (Story: any) => (
	<PathnameContext.Provider value={mockPathname}>
		<Story />
	</PathnameContext.Provider>
);

export const withParams = (Story: any) => (
	<PathParamsContext.Provider value={{ pid: "1" }}>
		<Story />
	</PathParamsContext.Provider>
);

// Mock the Next.js App Router
const mockAppRouter = {
	push: () => {},
	replace: () => {},
	refresh: () => {},
	back: () => {},
	forward: () => {},
	prefetch: () => {},
};

// Create a context for the mock router
const MockNavigationContext = React.createContext(mockAppRouter);

export const withAppRouter = (Story: any) => (
	<MockNavigationContext.Provider value={mockAppRouter}>
		<Story />
	</MockNavigationContext.Provider>
);
