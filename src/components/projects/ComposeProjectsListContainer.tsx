"use client";

import { FC, useMemo } from "react";
import { useComposeProjects, useDeleteProject } from "@/hooks/useComposeProjects";
import { ComposeProjectsList } from "./ComposeProjectsList";
import { mapEntryToRow } from "./projectRowMapper";

/**
 * Container that wires `ComposeProjectsList` to the Compose BFF.
 *
 * Intentionally thin: the hook owns fetch + state, the mapper owns shape
 * translation, and the presentational list owns rendering. When Hasura is
 * swapped for Cosmos / a Document Service later, none of these change — only
 * the BFF route handler does.
 */
export const ComposeProjectsListContainer: FC = () => {
	const { projects, loading, error, refetch } = useComposeProjects();
	const { deleteProject, isPending: deleteIsPending, error: deleteError } = useDeleteProject();
	const rows = useMemo(() => projects.map(mapEntryToRow), [projects]);
	return (
		<ComposeProjectsList
			projects={rows}
			loading={loading}
			error={error}
			onRetry={refetch}
			onDeleteProject={deleteProject}
			deleteIsPending={deleteIsPending}
			deleteError={deleteError ? deleteError.message : null}
		/>
	);
};

export default ComposeProjectsListContainer;
