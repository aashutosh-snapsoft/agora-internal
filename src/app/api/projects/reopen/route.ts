import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth0 } from "@/lib/auth0";
import { getOwnedProject } from "@/lib/projects/ownership-registry";
import { mintUserDelegationSas } from "@/lib/projects/azure-blob-keyless";

export const runtime = "nodejs";

/**
 * POST /api/projects/reopen
 *
 * Re-mints a FRESH user-delegation SAS for an OWNED, already-persisted project
 * container. The container persists across reopens; only the short-lived SAS
 * re-issues. Promoted from the demo-staging route (SCS-110/PR #569 review,
 * non-blocking item): without this, a project was frozen after its first
 * upload session, and a mid-batch SAS expiry (1h TTL, sequential uploads,
 * scanned PDFs) left it permanently partial with no recovery path.
 *
 * Gates:
 *   1. Auth0 session (401 on no session) — already enforced by src/middleware.ts's
 *      /projects check for the page; re-checked here since API routes aren't
 *      covered by that same identity-claims gate (session sub is sufficient —
 *      see the ownership check below, which is the actual authorization
 *      boundary either way).
 *   2. Ownership: the named project must resolve inside the caller's own
 *      partition; otherwise 403. The SAS is minted for the ROW's server-stored
 *      container/account, never raw client input.
 *
 * Body: { container } — the owned project/container id (accepts { id } as the alias).
 * Response (same shape as POST .../container):
 *   { account, container, sas_url, expires_at, display_name }
 *
 * Keyless throughout: the re-mint reuses mintUserDelegationSas (DefaultAzure-
 * Credential + getUserDelegationKey), never an account key.
 *
 * NO UI CALLER YET (PR #569 re-review, noted-not-blocking). This is a recovery
 * primitive with no wiring in ProjectsWorkspace.tsx — the workspace/file-browser
 * screen that would call it on a stale/expired SAS was deliberately dropped from
 * the SCS-110 promotion scope. Intended follow-up is resume-upload wiring in the
 * SCS-121 track; until then this route is reachable (session + ownership gated)
 * but dead from the product's perspective. Test coverage exists (see
 * __tests__/route.test.ts) independent of any UI caller.
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

	// Ownership gate: only the owner may re-mint a SAS for their container.
	const project = await getOwnedProject({ owner: sub, container: idRaw });
	if (!project) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	try {
		// Re-mint a FRESH SAS for the persisted, OWNED container. Keyless.
		const sas = await mintUserDelegationSas(project.container, {
			account: project.account,
		});

		return NextResponse.json(
			{
				account: sas.account,
				container: sas.container,
				sas_url: sas.sasUrl,
				expires_at: sas.expiresOn,
				display_name: project.displayName ?? project.container,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("[projects/reopen] failed to re-mint SAS for owned container", {
			container: project.container,
			error: error instanceof Error ? error.message : String(error),
		});
		Sentry.captureException(error, {
			level: "error",
			tags: { route: "projects/reopen" },
			extra: { container: project.container },
		});
		return NextResponse.json(
			{ error: "Failed to reopen project container" },
			{ status: 500 },
		);
	}
}
