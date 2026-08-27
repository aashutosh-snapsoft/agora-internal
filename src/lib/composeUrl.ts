/**
 * URL helpers for the cross-app handoff from Agora to v2-frontend (Compose).
 *
 * Agora hosts the projects directory; v2-frontend hosts the compose workflow
 * (`/multidoc-preview`, `/multidoc-preview/[documentId]`, `/projects/[pid]`).
 * App Gateway routes both under the same hostname in production, but during
 * local dev they run on separate ports. NEXT_PUBLIC_COMPOSE_BASE_URL is the
 * single config knob that points Agora at the right Compose mount:
 *
 *   Local dev:        http://localhost:3001  (v2-frontend dev port, cross-origin)
 *   Hosted (dev/prod): /workflow             (same-origin mount; App Gateway
 *                                             routes /workflow/* → v2-frontend)
 *
 * The value carries the v2-frontend /workflow basePath (see next.config.mjs in
 * the v2-frontend repo). The hosted value is a same-origin relative path, so
 * callers MUST navigate via a full-document load (plain <a> / location.assign),
 * never a Next <Link>/router.push — a soft route would stay inside Agora's
 * router (no /workflow route) and never reach the gateway. See SENG-791.
 */

export type ComposeStep = "upload" | "assign" | "merge" | "audit";

function baseUrl(): string {
	// NEXT_PUBLIC_* is inlined at build time. Empty no longer yields a working
	// relative URL: hosted, /multidoc-preview resolves inside Agora (which has no
	// /workflow route) and 404s — the value MUST be set (/workflow hosted,
	// http://localhost:3001 local). See SENG-791.
	const base = process.env.NEXT_PUBLIC_COMPOSE_BASE_URL ?? "";
	if (process.env.NODE_ENV === "development" && !base) {
		console.warn(
			"[composeUrl] NEXT_PUBLIC_COMPOSE_BASE_URL is not set — Compose handoff " +
				"links will 404. Set it to http://localhost:3001 for local dev.",
		);
	}
	return base;
}

/**
 * Build the resume URL for an in-progress project with an existing document.
 *
 * Targets v2-frontend's dynamic /multidoc-preview/[documentId] route, which
 * validates both `documentId` (path) and `projectId` (query) and opens the
 * session. The `step` param drives which view the user lands on inside the
 * workflow:
 *   upload  → no step param (rare; document exists but user is at upload)
 *   assign  → ?substep=assign
 *   merge   → ?step=merge
 *   audit   → ?step=validate   (v2-frontend's internal name for the audit step)
 *
 * NOTE on `audit → validate`: "audit" is the product / Hasura name; "validate"
 * is what v2-frontend reads from `searchParams.get("step")`. This mapping is a
 * cross-app coupling — if v2-frontend renames the param, this fn must update.
 * The parser lives in v2-frontend at:
 *   src/app/multidoc-preview/[documentId]/page.tsx
 *   https://github.com/SocraticsAI/v2-frontend/blob/main/src/app/multidoc-preview/%5BdocumentId%5D/page.tsx
 */
export function resumeComposeUrl(
	step: ComposeStep,
	projectId: string,
	documentId: string,
): string {
	const params = new URLSearchParams({ projectId });
	switch (step) {
		case "merge":
			params.set("step", "merge");
			break;
		case "audit":
			params.set("step", "validate");
			break;
		case "assign":
			params.set("substep", "assign");
			break;
		case "upload":
			// No step param — the workflow defaults to its initial step.
			break;
		default: {
			// Exhaustive switch. TypeScript will flag any new ComposeStep variant.
			const _exhaustive: never = step;
			void _exhaustive;
		}
	}
	return `${baseUrl()}/multidoc-preview/${encodeURIComponent(documentId)}?${params.toString()}`;
}

/**
 * Build the new-project URL for a freshly-created project shell that has no
 * document yet. Lands on v2-frontend's root /multidoc-preview which (per
 * v2-frontend PR1) reads `?projectId=` and binds the upcoming Cosmos document
 * to it.
 */
export function newComposeUrl(projectId: string): string {
	const params = new URLSearchParams({ projectId });
	return `${baseUrl()}/multidoc-preview?${params.toString()}`;
}

/**
 * Build the upload-entry URL with no projectId in the query string. Lands on
 * v2-frontend's `/multidoc-preview` where the user types a project name +
 * selects files; the Hasura row is created on upload submit (see
 * v2-frontend#26 / PR5). Used by Agora's "New project" button so we don't
 * leak a stale `?projectId=` parameter into a brand-new flow.
 */
export function composeUploadUrl(): string {
	return `${baseUrl()}/multidoc-preview`;
}

/**
 * Build the modeling URL for a project that has reached the "ready-to-model"
 * state. Lands on v2-frontend's /modeling-preview route. Whether that route
 * honors `?projectId=` today is independent of Agora's concerns; the param
 * is sent for forward-compat. If modeling lives at the same origin as Agora
 * eventually (post-migration), the empty base still produces a valid relative
 * URL.
 */
export function modelingComposeUrl(projectId: string): string {
	const params = new URLSearchParams({ projectId });
	return `${baseUrl()}/modeling-preview?${params.toString()}`;
}
