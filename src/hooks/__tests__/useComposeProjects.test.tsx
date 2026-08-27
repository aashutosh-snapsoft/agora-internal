/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	COMPOSE_PROJECTS_QUERY_KEY,
	useComposeProjects,
} from "../useComposeProjects";

const SAMPLE_PROJECTS = [
	{
		projectId: "p1",
		name: "Acme",
		sourceFiles: [],
		status: "mapping",
		updatedAt: "2026-04-17T12:00:00.000Z",
	},
];

function makeClient(): QueryClient {
	// Retry disabled so error tests don't time out on the 2 default retries.
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0 },
		},
	});
}

function wrapWithClient(client: QueryClient) {
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<QueryClientProvider client={client}>{children}</QueryClientProvider>
		);
	};
}

afterEach(() => {
	delete (global as unknown as { fetch?: jest.Mock }).fetch;
});

describe("useComposeProjects — React Query integration", () => {
	it("starts in loading state and resolves to the projects array on success", async () => {
		(global as unknown as { fetch: jest.Mock }).fetch = jest
			.fn()
			.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => SAMPLE_PROJECTS,
			});

		const { result } = renderHook(() => useComposeProjects(), {
			wrapper: wrapWithClient(makeClient()),
		});

		expect(result.current.loading).toBe(true);
		expect(result.current.projects).toEqual([]);
		expect(result.current.error).toBeNull();

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.projects).toEqual(SAMPLE_PROJECTS);
		expect(result.current.error).toBeNull();
	});

	it("populates error with the failure message when the BFF returns non-OK", async () => {
		(global as unknown as { fetch: jest.Mock }).fetch = jest
			.fn()
			.mockResolvedValue({
				ok: false,
				status: 500,
				json: async () => ({ error: "boom" }),
			});

		const { result } = renderHook(() => useComposeProjects(), {
			wrapper: wrapWithClient(makeClient()),
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toMatch(/500/);
		expect(result.current.projects).toEqual([]);
	});

	it("treats a non-array response body as an empty list (defensive)", async () => {
		(global as unknown as { fetch: jest.Mock }).fetch = jest
			.fn()
			.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ unexpected: true }),
			});

		const { result } = renderHook(() => useComposeProjects(), {
			wrapper: wrapWithClient(makeClient()),
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.projects).toEqual([]);
		expect(result.current.error).toBeNull();
	});

	it("re-fetches when refetch() is called", async () => {
		const fetchMock = jest
			.fn()
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => SAMPLE_PROJECTS,
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => [{ ...SAMPLE_PROJECTS[0], projectId: "p2", name: "Beta" }],
			});
		(global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

		const { result } = renderHook(() => useComposeProjects(), {
			wrapper: wrapWithClient(makeClient()),
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.projects).toEqual(SAMPLE_PROJECTS);

		await result.current.refetch();
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
		expect(result.current.projects[0].projectId).toBe("p2");
	});

	it("invalidating COMPOSE_PROJECTS_QUERY_KEY refetches the list", async () => {
		const fetchMock = jest
			.fn()
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => SAMPLE_PROJECTS,
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => [{ ...SAMPLE_PROJECTS[0], projectId: "p3", name: "Gamma" }],
			});
		(global as unknown as { fetch: jest.Mock }).fetch = fetchMock;

		const client = makeClient();
		const { result } = renderHook(() => useComposeProjects(), {
			wrapper: wrapWithClient(client),
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(fetchMock).toHaveBeenCalledTimes(1);

		await client.invalidateQueries({ queryKey: COMPOSE_PROJECTS_QUERY_KEY });
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
		expect(result.current.projects[0].projectId).toBe("p3");
	});

	it("exposes the canonical query key for external invalidation", () => {
		expect(COMPOSE_PROJECTS_QUERY_KEY).toEqual(["compose-projects", "list"]);
	});

	it("configures per-query staleTime (5 min) and gcTime (10 min)", async () => {
		// Project lists don't churn at the provider's 30 s default. The hook owns
		// this freshness contract per-query so other Agora hooks aren't affected.
		(global as unknown as { fetch: jest.Mock }).fetch = jest
			.fn()
			.mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => SAMPLE_PROJECTS,
			});

		// makeClient() sets gcTime: 0 at the defaults level, but per-query options
		// (passed by useComposeProjects via useQuery) override defaults — that's
		// exactly what this assertion exercises.
		const client = makeClient();
		const { result } = renderHook(() => useComposeProjects(), {
			wrapper: wrapWithClient(client),
		});
		await waitFor(() => expect(result.current.loading).toBe(false));

		const query = client
			.getQueryCache()
			.find({ queryKey: COMPOSE_PROJECTS_QUERY_KEY });
		expect(query?.options.staleTime).toBe(5 * 60 * 1000);
		expect(query?.options.gcTime).toBe(10 * 60 * 1000);
	});
});
