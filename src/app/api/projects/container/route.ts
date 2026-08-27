import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth0 } from "@/lib/auth0";
import { createContainerWithSas } from "@/lib/projects/azure-blob-keyless";
import { countOwnedProjects, createProject } from "@/lib/projects/ownership-registry";

export const runtime = "nodejs";

/**
 * Per-user project creation cap (PR #569 re-review, open question C).
 * Auth0 self-signup is open on this tenant, so any authenticated caller can
 * reach this route — an unbounded creation endpoint is a real abuse surface
 * (spin up unlimited containers), not just a hygiene concern. 50 is a first
 * guess sized well above any legitimate QoE workload (a handful of concurrent
 * engagements per user) with room to raise it; override via env without a
 * redeploy if it turns out too low/high in practice.
 */
const MAX_PROJECTS_PER_USER = Number(process.env.MAX_PROJECTS_PER_USER) || 50;

/**
 * POST /api/projects/container
 *
 * Creates a fresh PRIVATE per-project Blob container and mints a short-lived,
 * read+write+list+create (`rwlc`), container-scoped USER-DELEGATION SAS for it
 * (keyless — via DefaultAzureCredential + getUserDelegationKey; see
 * src/lib/projects/azure-blob-keyless.ts).
 *
 * Promoted from the demo-staging route (SCS-110 follow-up): the hidden-slug
 * gate is gone — this is the plain, session-gated /projects route, already
 * enforced by src/middleware.ts's /projects check.
 *
 * Ownership: after the container + SAS are minted, the route STAMPS an ownership
 * registry row owned by session.user.sub (PartitionKey = sub, RowKey = container).
 * This is what /delete authorizes against: a caller may only act on a container
 * that resolves inside their own partition.
 *
 * Per-user cap: before any Azure work happens, the route counts the caller's
 * existing rows and 429s past MAX_PROJECTS_PER_USER. Checked first (cheap Table
 * count) so a capped-out caller never even reaches container creation.
 *
 * NOT atomic (review on PR #569, non-blocking item): if the process dies
 * between the container being created and the ownership row being stamped,
 * the container is orphaned — no row means /delete 403s on it forever. Logged
 * loudly (including to Sentry) rather than silently swallowed so an orphan is
 * at least discoverable; a reaper or create-row-first ordering is a follow-up,
 * not fixed here.
 *
 * Body: { projectName } — used as the container-naming slug (see
 * buildContainerName) AND stored verbatim as the registry row's displayName,
 * so the project card shows the name the user actually typed, not the
 * generated container id. Falls back to "project" if blank.
 *
 * Response:
 *   { account, container, sas_url, expires_at, display_name }
 */
export async function POST(req: NextRequest) {
	const session = await auth0.getSession(req);
	if (!session?.user?.sub) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let payload: unknown;
	try {
		payload = await req.json();
	} catch {
		payload = {};
	}
	const body = (payload ?? {}) as Record<string, unknown>;
	const projectName =
		typeof body.projectName === "string" && body.projectName.trim().length > 0
			? body.projectName.trim()
			: "project";

	try {
		const existing = await countOwnedProjects({ owner: session.user.sub });
		if (existing >= MAX_PROJECTS_PER_USER) {
			return NextResponse.json(
				{ error: `Project limit reached (${MAX_PROJECTS_PER_USER}). Delete an existing project to create a new one.` },
				{ status: 429 },
			);
		}
	} catch (error) {
		console.error("[projects/container] failed to check per-user project count", {
			owner: session.user.sub,
			error: error instanceof Error ? error.message : String(error),
		});
		Sentry.captureException(error, {
			level: "error",
			tags: { route: "projects/container", failure: "cap-check" },
		});
		return NextResponse.json(
			{ error: "Failed to create project container" },
			{ status: 500 },
		);
	}

	let result: Awaited<ReturnType<typeof createContainerWithSas>> | undefined;
	try {
		result = await createContainerWithSas(projectName);
	} catch (error) {
		console.error("[projects/container] failed to create container + SAS", {
			error: error instanceof Error ? error.message : String(error),
		});
		return NextResponse.json(
			{ error: "Failed to create project container" },
			{ status: 500 },
		);
	}

	try {
		// Stamp the ownership row: this container now belongs to this session's
		// user. Server-stored account/container are the authority of record — no
		// later route trusts a client-supplied account/container/sas_url.
		await createProject({
			owner: session.user.sub,
			container: result.container,
			account: result.account,
			displayName: projectName,
		});
	} catch (error) {
		// The container now exists with no owning row — an orphan no /delete call
		// can ever reach (getOwnedProject resolves nothing, so it 403s). Loud on
		// purpose: this is the one failure mode that leaves unreachable state
		// behind rather than just failing the request.
		console.error("[projects/container] ORPHANED CONTAINER — container created but ownership stamp failed", {
			container: result.container,
			account: result.account,
			owner: session.user.sub,
			error: error instanceof Error ? error.message : String(error),
		});
		Sentry.captureException(error, {
			level: "error",
			tags: { route: "projects/container", failure: "orphaned-container" },
			extra: { container: result.container, account: result.account },
		});
		return NextResponse.json(
			{ error: "Failed to create project container" },
			{ status: 500 },
		);
	}

	return NextResponse.json(
		{
			account: result.account,
			container: result.container,
			sas_url: result.sasUrl,
			expires_at: result.expiresOn,
			display_name: projectName,
		},
		{ status: 201 },
	);
}
