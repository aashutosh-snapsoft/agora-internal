import { Project, ProjectListStatus } from "@/types/project";

const ACTIVE_PROCESSING_STATES = new Set([
	"",
	"empty",
	"uploaded",
	"document_processing",
	"ingesting",
	"calculating",
	"forecasting",
]);

export function isProjectInActiveProcessingState(
	project: Project | null | undefined
): boolean {
	const latestState = project?.project_states?.[0]?.state?.toLowerCase() ?? "";
	return ACTIVE_PROCESSING_STATES.has(latestState);
}

export function hasProjectBeenExported(project: Project | null | undefined): boolean {
	if (
		project?.metadata?.project_status !== "completed" ||
		!project.metadata.exported_to_excel_at
	) {
		return false;
	}

	const completedProjectStateId = project.metadata.completed_project_state_id;
	const latestProjectStateId = project.project_states?.[0]?.id;
	const latestProjectStateCreatedAt = project.project_states?.[0]?.created_at;

	if (completedProjectStateId && latestProjectStateId) {
		return completedProjectStateId === latestProjectStateId;
	}

	// Older exports may not have the state pin yet. Fall back to the
	// project-state timestamp so a later recalc invalidates completion.
	if (!latestProjectStateCreatedAt) {
		return true;
	}

	const exportedAt = Date.parse(project.metadata.exported_to_excel_at);
	const latestStateCreatedAt = Date.parse(latestProjectStateCreatedAt);

	if (Number.isNaN(exportedAt) || Number.isNaN(latestStateCreatedAt)) {
		return true;
	}

	return exportedAt >= latestStateCreatedAt;
}

export function getProjectListStatus(project: Project | null | undefined): ProjectListStatus {
	if (!project) {
		return "processing";
	}

	if (hasProjectBeenExported(project)) {
		return "completed";
	}

	if (isProjectInActiveProcessingState(project)) {
		return "processing";
	}

	if (project.metadata?.project_status === "needs_review") {
		return "needs_review";
	}

	return "processing";
}

export function buildProjectStatusMetadata(
	project: Project,
	status: ProjectListStatus,
	timestamp = new Date().toISOString()
) {
	const currentMetadata = project.metadata ?? {};
	const nextMetadata = { ...currentMetadata, project_status: status };
	const latestProjectStateId = project.project_states?.[0]?.id ?? null;

	if (status === "completed") {
		const alreadyCompletedForCurrentState =
			hasProjectBeenExported(project) &&
			(latestProjectStateId === null ||
				currentMetadata.completed_project_state_id === latestProjectStateId ||
				currentMetadata.completed_project_state_id == null);

		nextMetadata.exported_to_excel_at = alreadyCompletedForCurrentState
			? currentMetadata.exported_to_excel_at ?? timestamp
			: timestamp;
		nextMetadata.completed_project_state_id = latestProjectStateId;
	} else {
		nextMetadata.completed_project_state_id = null;
	}

	return nextMetadata;
}
