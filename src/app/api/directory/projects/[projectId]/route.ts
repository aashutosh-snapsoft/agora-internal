import { NextRequest, NextResponse } from "next/server";
import { getUserFromSessionOrThrow, IdentityError } from "@/lib/identity";
import { FinancialModelsContainer, NotFoundOrForbiddenError } from "@/server/cosmos/financialModels";

function safeErr(e: unknown): { code?: string; message: string } {
	const err = e as { code?: string | number; message?: unknown } | null;
	const code = err?.code != null ? String(err.code) : undefined;
	const raw = typeof err?.message === "string" ? err.message : "";
	return { code, message: raw.slice(0, 200) };
}

export const runtime = "nodejs";

/**
 * DELETE /api/directory/projects/[projectId]
 *
 * Soft-deletes the canonical Cosmos document for the given project. Before
 * mutating, performs an ownership check: the caller must belong to the same
 * tenant as the document AND be listed as an owner (via `acl.owners` or the
 * legacy `owner_user_id` scalar). A mismatch returns 404 — indistinguishable
 * from "not found" — so the endpoint cannot be used as an existence oracle for
 * projects the caller doesn't own.
 *
 * On success the document is patched with `deleted_at` / `deleted_by` /
 * `status: "deleted"` rather than hard-removed, so it remains auditable. The
 * list query filters `IS_DEFINED(c.deleted_at)`, making the delete transparent
 * to the directory UI.
 *
 * Idempotent: if Cosmos returns 404 after the ownership check has passed
 * (e.g. a concurrent delete), we treat it as success so the UI can move on.
 */
export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ projectId: string }> },
) {
	try {
		const user = await getUserFromSessionOrThrow(req);

		if (!user.tenant_id) {
			return NextResponse.json(
				{ error: "User has no tenant_id" },
				{ status: 403 },
			);
		}

		const { projectId } = await params;
		if (!projectId) {
			return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
		}

		let container: FinancialModelsContainer;
		try {
			container = FinancialModelsContainer.fromEnv();
		} catch (e) {
			console.error("[/api/directory/projects/[projectId]] Cosmos not configured", safeErr(e));
			return NextResponse.json(
				{ error: "Server misconfigured: Cosmos is not configured" },
				{ status: 500 },
			);
		}

		try {
			await container.deleteProject({
				projectId,
				tenantId: user.tenant_id,
				ownerUserId: user.external_id,
			});
		} catch (e) {
			// 404 means not found or not owned — both surface as 404 (no oracle).
			if (e instanceof NotFoundOrForbiddenError) {
				return NextResponse.json(
					{ error: "Not found" },
					{ status: 404 },
				);
			}
			console.error("[/api/directory/projects/[projectId]] Cosmos delete failed", safeErr(e));
			return NextResponse.json({ error: "Bad gateway" }, { status: 502 });
		}

		return new NextResponse(null, { status: 204 });
	} catch (e) {
		if (e instanceof IdentityError) {
			return NextResponse.json({ error: e.message }, { status: e.status });
		}
		console.error("[/api/directory/projects/[projectId]] Unhandled error", safeErr(e));
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
