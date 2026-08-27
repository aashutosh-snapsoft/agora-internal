import {
	buildProjectStatusMetadata,
	getProjectListStatus,
	hasProjectBeenExported,
} from "../project-status";
import { Project } from "@/types/project";

describe("project status helpers", () => {
	it("returns completed when the project has been exported to Excel", () => {
		const project: Project = {
			id: "project-1",
			name: "Test Project",
			metadata: {
				exported_to_excel_at: "2026-03-08T12:00:00.000Z",
				project_status: "completed",
				completed_project_state_id: "state-1",
			},
			project_states: [
				{
					id: "state-1",
					state: "calculated",
					data: {},
					created_at: "2026-03-08T12:00:00.000Z",
				},
			],
		};

		expect(hasProjectBeenExported(project)).toBe(true);
		expect(getProjectListStatus(project)).toBe("completed");
	});

	it("invalidates completed when the latest project state changes after export", () => {
		const project: Project = {
			id: "project-1b",
			name: "Revised Project",
			metadata: {
				exported_to_excel_at: "2026-03-08T12:00:00.000Z",
				project_status: "completed",
				completed_project_state_id: "state-before-export",
			},
			project_states: [
				{
					id: "state-after-revision",
					state: "calculated",
					data: {},
					created_at: "2026-03-08T13:00:00.000Z",
				},
			],
		};

		expect(hasProjectBeenExported(project)).toBe(false);
		expect(getProjectListStatus(project)).toBe("processing");
	});

	it("keeps legacy completed projects completed when export happened after the latest state", () => {
		const project: Project = {
			id: "project-1c",
			name: "Legacy Exported Project",
			metadata: {
				exported_to_excel_at: "2026-03-08T13:00:00.000Z",
				project_status: "completed",
			},
			project_states: [
				{
					id: "state-before-export",
					state: "calculated",
					data: {},
					created_at: "2026-03-08T12:00:00.000Z",
				},
			],
		};

		expect(hasProjectBeenExported(project)).toBe(true);
		expect(getProjectListStatus(project)).toBe("completed");
	});

	it("invalidates legacy completed projects when a newer state was created after export", () => {
		const project: Project = {
			id: "project-1d",
			name: "Legacy Revised Project",
			metadata: {
				exported_to_excel_at: "2026-03-08T12:00:00.000Z",
				project_status: "completed",
			},
			project_states: [
				{
					id: "state-after-export",
					state: "calculated",
					data: {},
					created_at: "2026-03-08T13:00:00.000Z",
				},
			],
		};

		expect(hasProjectBeenExported(project)).toBe(false);
		expect(getProjectListStatus(project)).toBe("processing");
	});

	it("returns needs_review when persisted validation status says review is required", () => {
		const project: Project = {
			id: "project-2",
			name: "Review Project",
			metadata: {
				project_status: "needs_review",
			},
			project_states: [
				{
					id: "state-1",
					state: "calculated",
					data: {},
					created_at: "2026-03-08T12:00:00.000Z",
				},
			],
		};

		expect(getProjectListStatus(project)).toBe("needs_review");
	});

	it("returns processing for projects that are still being verified", () => {
		const project: Project = {
			id: "project-3",
			name: "Processing Project",
			project_states: [
				{
					id: "state-2",
					state: "document_processing",
					data: {},
					created_at: "2026-03-08T12:00:00.000Z",
				},
			],
		};

		expect(getProjectListStatus(project)).toBe("processing");
	});

	it("returns processing for invalid projects unless review status was explicitly persisted", () => {
		const project: Project = {
			id: "project-3b",
			name: "Invalid Project",
			project_states: [
				{
					id: "state-3b",
					state: "invalid",
					data: {},
					created_at: "2026-03-08T12:00:00.000Z",
				},
			],
		};

		expect(getProjectListStatus(project)).toBe("processing");
	});

	it("adds an export timestamp when persisting completed status", () => {
		const timestamp = "2026-03-08T12:34:56.000Z";
		const project: Project = {
			id: "project-4",
			name: "Completed Project",
			metadata: {
				project_status: "processing",
			},
			project_states: [
				{
					id: "state-4",
					state: "calculated",
					data: {},
					created_at: "2026-03-08T12:00:00.000Z",
				},
			],
		};

		expect(buildProjectStatusMetadata(project, "completed", timestamp)).toEqual({
			project_status: "completed",
			exported_to_excel_at: timestamp,
			completed_project_state_id: "state-4",
		});
	});

	it("preserves the original export timestamp when backfilling a pin for an already-completed project", () => {
		const project: Project = {
			id: "project-4b",
			name: "Legacy Completed Project",
			metadata: {
				project_status: "completed",
				exported_to_excel_at: "2026-03-08T12:34:56.000Z",
			},
			project_states: [
				{
					id: "state-4b",
					state: "calculated",
					data: {},
					created_at: "2026-03-08T12:00:00.000Z",
				},
			],
		};

		expect(
			buildProjectStatusMetadata(project, "completed", "2026-03-08T14:00:00.000Z")
		).toEqual({
			project_status: "completed",
			exported_to_excel_at: "2026-03-08T12:34:56.000Z",
			completed_project_state_id: "state-4b",
		});
	});

	it("clears the completed state pin when persisting a non-completed status", () => {
		const project: Project = {
			id: "project-5",
			name: "Downgraded Project",
			metadata: {
				project_status: "completed",
				exported_to_excel_at: "2026-03-08T12:34:56.000Z",
				completed_project_state_id: "state-5",
			},
		};

		expect(buildProjectStatusMetadata(project, "needs_review")).toEqual({
			project_status: "needs_review",
			exported_to_excel_at: "2026-03-08T12:34:56.000Z",
			completed_project_state_id: null,
		});
	});
});
