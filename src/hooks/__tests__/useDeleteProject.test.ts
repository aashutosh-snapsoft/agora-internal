/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDeleteProject, COMPOSE_PROJECTS_QUERY_KEY } from "../useComposeProjects";

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return {
		wrapper: ({ children }: { children: React.ReactNode }) =>
			React.createElement(QueryClientProvider, { client: queryClient }, children),
		queryClient,
	};
}

beforeEach(() => {
	global.fetch = jest.fn();
});

afterEach(() => {
	jest.resetAllMocks();
});

describe("useDeleteProject", () => {
	it("calls DELETE with encodeURIComponent on the projectId", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204 });
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteProject(), { wrapper });

		await act(async () => {
			result.current.deleteProject("proj/with spaces");
		});

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/directory/projects/proj%2Fwith%20spaces",
			{ method: "DELETE" },
		);
	});

	it("invalidates COMPOSE_PROJECTS_QUERY_KEY on success", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204 });
		const { wrapper, queryClient } = createWrapper();
		const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useDeleteProject(), { wrapper });

		await act(async () => {
			result.current.deleteProject("proj-1");
		});

		await waitFor(() => {
			expect(invalidateSpy).toHaveBeenCalledWith({
				queryKey: COMPOSE_PROJECTS_QUERY_KEY,
			});
		});
	});

	it("surfaces the server error message when the response is not OK", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status: 404,
			json: async () => ({ error: "Not found" }),
		});
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteProject(), { wrapper });

		// mutateAsync re-throws on failure — swallow the rejection here; the
		// error is surfaced via result.current.error (set by useMutation).
		await act(async () => {
			await result.current.deleteProject("missing-proj").catch(() => {});
		});

		await waitFor(() => {
			expect(result.current.error).not.toBeNull();
			expect(result.current.error?.message).toBe("Not found");
		});
	});

	it("falls back to 'Delete failed: <status>' when the error body has no message", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status: 502,
			json: async () => ({}),
		});
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteProject(), { wrapper });

		// mutateAsync re-throws on failure — swallow the rejection here; the
		// error is surfaced via result.current.error (set by useMutation).
		await act(async () => {
			await result.current.deleteProject("proj-1").catch(() => {});
		});

		await waitFor(() => {
			expect(result.current.error?.message).toBe("Delete failed: 502");
		});
	});

	it("exposes isPending=true while the mutation is in-flight", async () => {
		let resolve!: () => void;
		(global.fetch as jest.Mock).mockReturnValue(
			new Promise<{ ok: boolean; status: number }>((res) => {
				resolve = () => res({ ok: true, status: 204 });
			}),
		);
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useDeleteProject(), { wrapper });

		act(() => {
			result.current.deleteProject("proj-1");
		});

		// isPending should be true immediately while fetch is unresolved
		await waitFor(() => expect(result.current.isPending).toBe(true));

		await act(async () => {
			resolve();
		});

		await waitFor(() => expect(result.current.isPending).toBe(false));
	});

	it("does not invalidate on failure", async () => {
		(global.fetch as jest.Mock).mockResolvedValue({
			ok: false,
			status: 500,
			json: async () => ({ error: "server error" }),
		});
		const { wrapper, queryClient } = createWrapper();
		const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
		const { result } = renderHook(() => useDeleteProject(), { wrapper });

		// mutateAsync re-throws on failure — swallow the rejection here; the
		// error is surfaced via result.current.error (set by useMutation).
		await act(async () => {
			await result.current.deleteProject("proj-1").catch(() => {});
		});

		await waitFor(() => expect(result.current.error).not.toBeNull());
		expect(invalidateSpy).not.toHaveBeenCalled();
	});
});
