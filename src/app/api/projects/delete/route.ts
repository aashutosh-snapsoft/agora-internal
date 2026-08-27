import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth0 } from "@/lib/auth0";
import { getOwnedProject, deleteOwnedProject } from "@/lib/projects/ownership-registry";
import { getBlobServiceClient } from "@/lib/projects/azure-blob-keyless";

export const runtime = "nodejs";

/**
 * POST /api/projects/delete
 *
 * Deletes one of the caller's OWN projects: the Azure Blob container (and
 * every blob in it) plus the ownership-registry row. The browser POSTs only
 * WHICH of its own projects to delete; the server resolves the ownership row
 * and acts on the ROW's server-stored account/container — client input is
 * never trusted beyond the id.
 *
 * Gates:
 *   1. Auth0 session (401 when absent).
 *   2. Ownership: getOwnedProject({owner: sub, container}) — 403 when absent, so
 *      a caller can never delete another user's container.
 *
 * Order of operations: blob container FIRST, registry row SECOND. If the blob
 * delete fails the row survives and the project stays visible (retryable); the
 * reverse order could orphan a container with no owning row. A container that is
 * already gone (404) is treated as deleted — the row is still removed.
 *
 * Body: { container } (accepts { id } as the alias).
 * Returns { ok: true } (200) on success.
 */
export async function POST(req: NextRequest) {
	const session = await auth0.getSession(req);
	if (!session?.user?.sub) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const sub = session.user.sub;

	let payload: unknown;
	try {
		payload = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	const body = (payload ?? {}) as Record<string, unknown>;
	const idRaw = body.container ?? body.id;
	if (typeof idRaw !== "string" || idRaw.length === 0) {
		return NextResponse.json(
			{ error: "Missing or invalid container (project id)" },
			{ status: 400 },
		);
	}

	// Ownership gate: resolve the row by (owner, id). Absent → 403.
	const project = await getOwnedProject({ owner: sub, container: idRaw });
	if (!project) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	try {
		// Blob container first (row second — see the header for why this order).
		// deleteIfExists: an already-gone container still counts as deleted.
		const blobClient = getBlobServiceClient(project.account);
		await blobClient.getContainerClient(project.container).deleteIfExists();

		await deleteOwnedProject({ owner: sub, container: project.container });
	} catch (error) {
		console.error("[projects/delete] failed to delete project", {
			container: project.container,
			error: error instanceof Error ? error.message : String(error),
		});
		Sentry.captureException(error, {
			level: "error",
			tags: { route: "projects/delete" },
			extra: { container: project.container },
		});
		return NextResponse.json(
			{ error: "Failed to delete project" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true }, { status: 200 });
}
