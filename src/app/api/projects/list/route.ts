import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth0 } from "@/lib/auth0";
import { listOwnedProjects } from "@/lib/projects/ownership-registry";

export const runtime = "nodejs";

/**
 * GET /api/projects/list
 *
 * Returns the caller's OWN projects — an owner-scoped list (PartitionKey eq
 * session.user.sub). No cross-partition query is ever issued, so a caller can
 * never observe another user's projects: the owner scope is structural, not a
 * post-filter. There is no per-project ownership check here because the query
 * itself is owner-scoped — the partition key IS the authorization boundary.
 *
 * Response:
 *   { projects: [{ container, account, displayName, createdAt, status }] }   // newest first
 */
export async function GET(req: NextRequest) {
	const session = await auth0.getSession(req);
	if (!session?.user?.sub) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const projects = await listOwnedProjects({ owner: session.user.sub });
		return NextResponse.json({ projects }, { status: 200 });
	} catch (error) {
		console.error("[projects/list] failed to list owned projects", {
			error: error instanceof Error ? error.message : String(error),
		});
		Sentry.captureException(error, {
			level: "error",
			tags: { route: "projects/list" },
		});
		return NextResponse.json(
			{ error: "Failed to list projects" },
			{ status: 500 },
		);
	}
}
