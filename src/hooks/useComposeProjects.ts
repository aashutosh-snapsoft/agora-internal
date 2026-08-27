"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectDirectoryEntry } from "@/types/projectDirectory";

/**
 * Compose projects list query key. Exported so callers can invalidate it
 * after mutations (e.g. when a future "delete project" affordance lands and
 * needs to refetch). Follows Agora's inline-array convention — see
 * src/hooks/useErgonWorkflowStatus.ts for an existing example.
 */
export const COMPOSE_PROJECTS_QUERY_KEY = ["compose-projects", "list"] as const;

const ENDPOINT = "/api/directory/projects";

async function fetchComposeProjects(
	signal?: AbortSignal,
): Promise<ProjectDirectoryEntry[]> {
	const res = await fetch(ENDPOINT, { signal });
	if (!res.ok) {
		throw new Error(`Request failed with status ${res.status}`);
	}
	const data = (await res.json()) as ProjectDirectoryEntry[];
	// Defensive: a 200 with a non-array body (e.g. `{ error: "..." }` from a
	// misbehaving upstream that didn't set a 5xx status) would otherwise
	// propagate as `undefined.map` in the consumer. Coerce to empty list so
	// the UI shows "no projects" instead of crashing.
	return Array.isArray(data) ? data : [];
}

export type UseComposeProjectsResult = {
	projects: ProjectDirectoryEntry[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
};

/**
 * Fetches the caller's projects from the Compose BFF via React Query. The
 * route handler at `src/app/api/directory/projects/route.ts` is the migration
 * seam — when Hasura is swapped out for Cosmos / a Document Service later,
 * only the BFF body changes. This hook and its key stay still.
 *
 * Freshness: Agora's QueryProvider default `staleTime` is 30 s, which is too
 * aggressive for a project list (refetches on every tab focus would be
 * noisy). Override per-query to 5 minutes; project lists don't churn at that
 * cadence and explicit mutations invalidate via `COMPOSE_PROJECTS_QUERY_KEY`.
 *
 * Exported shape matches the previous bespoke implementation so the container
 * (`ComposeProjectsListContainer`) is untouched.
 */
export type UseDeleteProjectResult = {
	/**
	 * Async function that soft-deletes a project and resolves on success.
	 * Rejects with an Error on failure so callers can `.catch()` or use
	 * try/await to keep the confirmation dialog open on error.
	 */
	deleteProject: (projectId: string) => Promise<void>;
	isPending: boolean;
	error: Error | null;
};

/**
 * Mutation to soft-delete a compose project. Invalidates the project list
 * query on success so the UI refreshes automatically. Exposes `isPending`
 * and `error` so the UI can disable the confirm button while in-flight and
 * surface a failure message when the request is rejected.
 *
 * Returns `mutateAsync` (not `mutate`) so callers can await the operation
 * and chain `.then(() => closeDialog())` — the dialog stays open during
 * in-flight requests and on error, and closes only on success.
 */
export function useDeleteProject(): UseDeleteProjectResult {
	const queryClient = useQueryClient();
	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: async (projectId: string) => {
			const res = await fetch(
				`/api/directory/projects/${encodeURIComponent(projectId)}`,
				{ method: "DELETE" },
			);
			if (!res.ok && res.status !== 204) {
				const body = await res.json().catch(() => ({}));
				throw new Error(
					(body as { error?: string }).error ?? `Delete failed: ${res.status}`,
				);
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: COMPOSE_PROJECTS_QUERY_KEY });
		},
		onError: (err: Error) => {
			// Error is surfaced to callers via the returned `error` field; no
			// additional side-effect (e.g. toast) here so the presentational
			// component controls the affordance.
			console.error("[useDeleteProject] delete failed:", err.message);
		},
	});
	return { deleteProject: mutateAsync, isPending, error };
}

export function useComposeProjects(): UseComposeProjectsResult {
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: COMPOSE_PROJECTS_QUERY_KEY,
		queryFn: ({ signal }) => fetchComposeProjects(signal),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	return {
		projects: data ?? [],
		loading: isLoading,
		error:
			error instanceof Error
				? error.message
				: error
					? String(error)
					: null,
		refetch: async () => {
			await refetch();
		},
	};
}
