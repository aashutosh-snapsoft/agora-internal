import { NextRequest, NextResponse } from "next/server";
import { getUserFromSessionOrThrow, IdentityError } from "@/lib/identity";
import { FinancialModelsContainer } from "@/server/cosmos/financialModels";
import type { ProjectDirectoryEntry } from "@/types/projectDirectory";

export const runtime = "nodejs";

// Cosmos error objects can carry the bound query parameter values (tenant_id,
// external_id) in `body`/`message`. Until the durable sanitized logger lands
// (see TODO(soc2-logging) markers below), strip everything but a stable code
// and a short, length-capped message before logging.
function safeErr(e: unknown): { code?: string; message: string } {
	const err = e as { code?: string | number; message?: unknown } | null;
	const code = err?.code != null ? String(err.code) : undefined;
	const raw = typeof err?.message === "string" ? err.message : "";
	return { code, message: raw.slice(0, 200) };
}

/**
 * BFF for the Compose project-list view in Agora.
 *
 * Reads the **canonical Cosmos document** — the single source of truth for
 * project directory metadata (name, status, source files, last-modified), per
 * docs/project-directory-store-decision.md (v2-frontend repo). This supersedes
 * `task_3.1_target_architecture.md` §9, which placed the directory row in
 * Postgres. By application invariant, the canonical doc's `id == project_id`
 * (written this way by v2-frontend's `buildCanonicalDoc` stamp). Replaces the
 * previous Hasura read, which the Compose flow never populated (it writes
 * Cosmos), so the list showed `—` for source file and had no
 * `latestDocumentId` to resume from.
 *
 * Scope: the projects the current user owns. `owner_user_id` / `acl.owners`
 * carry the Auth0 sub (IdentityUser.external_id); tenant is matched on
 * `tenant_id`. Team-level visibility and full ACL enumeration are the durable
 * read-model's job — out of scope here.
 *
 * Identity is stamped onto the canonical doc by v2-frontend's `/api/documents`
 * during the compose flow; this read only returns projects whose doc carries
 * that real identity.
 */
export async function GET(req: NextRequest) {
	try {
		const user = await getUserFromSessionOrThrow(req);

		if (!user.tenant_id) {
			// Agora's IdentityUser.tenant_id is nullable. Without it we cannot
			// safely scope the query; bail rather than silently leaking.
			return NextResponse.json(
				{ error: "User has no tenant_id" },
				{ status: 403 },
			);
		}

		let container: FinancialModelsContainer;
		try {
			container = FinancialModelsContainer.fromEnv();
		} catch (e) {
			// TODO(soc2-logging): route through sanitized logger when available
			console.error("[/api/directory/projects] Cosmos not configured", safeErr(e));
			return NextResponse.json(
				{ error: "Server misconfigured: Cosmos is not configured" },
				{ status: 500 },
			);
		}

		// Cosmos is the upstream here — a failure reading it is a 502 (bad
		// gateway), distinct from a 500 (a bug in our own mapping below).
		let docs;
		try {
			// Dev/emulator: ensure the database + container exist (no-op in prod
			// and after first init).
			await container.ensureExists();
			docs = await container.listProjectsForUser({
				ownerUserId: user.external_id,
				tenantId: user.tenant_id,
			});
		} catch (e) {
			// TODO(soc2-logging): route through sanitized logger when available
			console.error("[/api/directory/projects] Cosmos query failed", safeErr(e));
			return NextResponse.json({ error: "Bad gateway" }, { status: 502 });
		}

		const entries: ProjectDirectoryEntry[] = docs.map((d) => ({
			projectId: d.project_id ?? d.projectId ?? d.id,
			name: d.name ?? "",
			sourceFiles: (d.sources ?? [])
				.map((s) => s?.filename)
				.filter((f): f is string => typeof f === "string" && f.length > 0),
			status: d.status ?? "",
			updatedAt: d.updated_at ?? "",
		}));

		return NextResponse.json(entries);
	} catch (e) {
		if (e instanceof IdentityError) {
			return NextResponse.json({ error: e.message }, { status: e.status });
		}
		// TODO(soc2-logging): route through sanitized logger when available
		console.error("[/api/directory/projects] Unhandled error", safeErr(e));
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
