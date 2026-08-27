import { DateTime } from "luxon";
import type { ComposeStep } from "@/lib/composeUrl";
import type {
	CanonicalStatus,
	ProjectDirectoryEntry,
} from "@/types/projectDirectory";

export type { ComposeStep };
export type { ProjectDirectoryEntry } from "@/types/projectDirectory";
export type ProjectStatus = "compose-in-progress" | "ready-to-model";

export type ProjectRow = {
	id: string;
	name: string;
	sourceFile: string;
	additionalFiles: string[];
	lastModified: string;
	status: ProjectStatus;
	currentStep: ComposeStep;
	// Resume target for the cross-origin handoff to v2-frontend's
	// /multidoc-preview/[documentId]. By application invariant (enforced by
	// v2-frontend's buildCanonicalDoc stamp), the canonical doc's `id` equals
	// `project_id`, so this is the projectId. Listed rows always have a doc
	// (that's why they're in the list), so it's non-null.
	latestDocumentId: string | null;
};

// Single source of truth for state-driven UI behavior, keyed by the canonical
// document `status` enum (financial-model.schema.json $defs/ProjectStatus),
// authoritatively written by the v2-backend worker pipeline.
// - `step` powers the resume URL (resumeComposeUrl) for in-progress projects.
// - `ready` powers the status badge ("Ready to model" vs "Compose in progress").
//
// Keyed on the closed `CanonicalStatus` union so the Record is exhaustive:
// adding/renaming a status breaks the build here until both decisions (step +
// ready) are made. The mapper test asserts this table verbatim.
//
// `ready` (→ "ready-to-model") is true only once the model is review-complete:
// `verified` / `complete`. Earlier pipeline stages stay "compose-in-progress".
export const STATUS_DERIVATION: Record<
	CanonicalStatus,
	{ step: ComposeStep; ready: boolean }
> = {
	uploaded: { step: "upload", ready: false },
	ingesting: { step: "assign", ready: false },
	classifying: { step: "assign", ready: false },
	mapping: { step: "merge", ready: false },
	reviewing: { step: "audit", ready: false },
	verified: { step: "audit", ready: true },
	complete: { step: "audit", ready: true },
};

const PLACEHOLDER = "—";

function formatUpdatedAt(iso: string | undefined): string {
	if (!iso) return PLACEHOLDER;
	const value = DateTime.fromISO(iso);
	return value.isValid ? value.toFormat("MMM d, yyyy") : PLACEHOLDER;
}

export function mapEntryToRow(entry: ProjectDirectoryEntry): ProjectRow {
	// The backend may emit a new status before this table is updated. Default to
	// {step:"upload", ready:false} on unknown values so the row stays routable
	// and conservatively non-ready rather than passing `undefined` downstream.
	const derived = STATUS_DERIVATION[entry.status as CanonicalStatus] ?? {
		step: "upload" as const,
		ready: false,
	};

	const files = entry.sourceFiles ?? [];

	return {
		id: entry.projectId ?? "",
		name: entry.name?.trim() ? entry.name : "Untitled project",
		sourceFile: files[0] ?? PLACEHOLDER,
		additionalFiles: files.slice(1),
		lastModified: formatUpdatedAt(entry.updatedAt),
		status: derived.ready ? "ready-to-model" : "compose-in-progress",
		currentStep: derived.step,
		// By application invariant the canonical doc's id == projectId — the
		// resume handoff target.
		latestDocumentId: entry.projectId || null,
	};
}
