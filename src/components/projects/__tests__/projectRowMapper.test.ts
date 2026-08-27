import {
	STATUS_DERIVATION,
	mapEntryToRow,
	type ProjectDirectoryEntry,
	type ProjectRow,
} from "../projectRowMapper";

const baseEntry: ProjectDirectoryEntry = {
	projectId: "p1",
	name: "Acme Corp",
	sourceFiles: [],
	status: "mapping",
	updatedAt: "2026-04-17T12:00:00.000Z",
};

describe("STATUS_DERIVATION", () => {
	// Keyed by the canonical Cosmos `status` enum (financial-model.schema.json
	// $defs/ProjectStatus), written by the v2-backend worker. `ready` (→
	// "ready-to-model") is true only once review-complete: verified / complete.
	// Asserted verbatim so any change is deliberate.
	it("matches the committed canonical-status mapping", () => {
		expect(STATUS_DERIVATION).toEqual({
			uploaded: { step: "upload", ready: false },
			ingesting: { step: "assign", ready: false },
			classifying: { step: "assign", ready: false },
			mapping: { step: "merge", ready: false },
			reviewing: { step: "audit", ready: false },
			verified: { step: "audit", ready: true },
			complete: { step: "audit", ready: true },
		});
	});
});

describe("mapEntryToRow — status derivation", () => {
	it.each([["verified"], ["complete"]] as const)(
		"treats %s as ready-to-model",
		(status) => {
			expect(mapEntryToRow({ ...baseEntry, status }).status).toBe("ready-to-model");
		},
	);

	it.each([
		["uploaded"],
		["ingesting"],
		["classifying"],
		["mapping"],
		["reviewing"],
	] as const)("treats %s as compose-in-progress", (status) => {
		expect(mapEntryToRow({ ...baseEntry, status }).status).toBe("compose-in-progress");
	});

	it("treats an unknown / empty status as compose-in-progress", () => {
		expect(mapEntryToRow({ ...baseEntry, status: "" }).status).toBe("compose-in-progress");
		expect(mapEntryToRow({ ...baseEntry, status: "future_status" }).status).toBe(
			"compose-in-progress",
		);
	});
});

describe("mapEntryToRow — currentStep derivation", () => {
	const cases: Array<[string, ProjectRow["currentStep"]]> = [
		["uploaded", "upload"],
		["ingesting", "assign"],
		["classifying", "assign"],
		["mapping", "merge"],
		["reviewing", "audit"],
		["verified", "audit"],
		["complete", "audit"],
	];

	it.each(cases)("maps status %s → currentStep %s", (status, step) => {
		expect(mapEntryToRow({ ...baseEntry, status }).currentStep).toBe(step);
	});

	it("falls back to upload on an unknown status", () => {
		expect(mapEntryToRow({ ...baseEntry, status: "future_status" }).currentStep).toBe(
			"upload",
		);
	});
});

describe("mapEntryToRow — latestDocumentId (resume target)", () => {
	it("sets latestDocumentId to the projectId (canonical doc id == project_id)", () => {
		const row = mapEntryToRow({ ...baseEntry, projectId: "proj-xyz" });
		expect(row.latestDocumentId).toBe("proj-xyz");
		expect(row.id).toBe("proj-xyz");
	});
});

describe("mapEntryToRow — file projection", () => {
	it("uses the first source file as sourceFile and the rest as additionalFiles", () => {
		const row = mapEntryToRow({
			...baseEntry,
			sourceFiles: ["Income_Statement.xlsx", "Balance_Sheet.xlsx", "Cash_Flow.xlsx"],
		});
		expect(row.sourceFile).toBe("Income_Statement.xlsx");
		expect(row.additionalFiles).toEqual(["Balance_Sheet.xlsx", "Cash_Flow.xlsx"]);
	});

	it("uses a placeholder sourceFile when there are no source files", () => {
		const row = mapEntryToRow({ ...baseEntry, sourceFiles: [] });
		expect(row.sourceFile).toBe("—");
		expect(row.additionalFiles).toEqual([]);
	});
});

describe("mapEntryToRow — scalars and edge cases", () => {
	it("falls back to a default name when name is missing or blank", () => {
		expect(mapEntryToRow({ ...baseEntry, name: "" }).name).toBe("Untitled project");
	});

	it("formats updatedAt as MMM d, yyyy", () => {
		expect(
			mapEntryToRow({ ...baseEntry, updatedAt: "2026-04-17T08:30:00.000Z" }).lastModified,
		).toBe("Apr 17, 2026");
	});

	it("returns a dash for lastModified when updatedAt is missing or unparseable", () => {
		expect(mapEntryToRow({ ...baseEntry, updatedAt: "" }).lastModified).toBe("—");
		expect(mapEntryToRow({ ...baseEntry, updatedAt: "not-a-date" }).lastModified).toBe("—");
	});
});
