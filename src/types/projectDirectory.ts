/**
 * The canonical project-directory lifecycle status, mirroring
 * `financial-model.schema.json` `$defs/ProjectStatus`, authoritatively written
 * by the v2-backend worker pipeline. Kept as a closed union so the
 * status→step/ready table (`STATUS_DERIVATION`) is exhaustive at compile time.
 */
export type CanonicalStatus =
	| "uploaded"
	| "ingesting"
	| "classifying"
	| "mapping"
	| "reviewing"
	| "verified"
	| "complete";

/**
 * API contract for one row of the project-directory list, served by
 * `GET /api/directory/projects` (which reads the canonical Cosmos document —
 * the single source of truth for directory metadata).
 *
 * `projectId === the Cosmos document id`, so it doubles as the resume target
 * the cross-origin handoff routes to (`${COMPOSE_BASE}/multidoc-preview/{projectId}`).
 * `status` is the on-the-wire string (a `CanonicalStatus`, but typed `string`
 * since the backend may emit a value before this enum is updated).
 */
export type ProjectDirectoryEntry = {
	projectId: string;
	name: string;
	sourceFiles: string[];
	status: string;
	updatedAt: string;
};
