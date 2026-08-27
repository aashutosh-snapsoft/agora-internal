// NOTE: no `import "server-only"` guard here — Agora doesn't have that package
// wired into its build/jest setup, and this module is only imported by the
// server-side API route (`/api/directory/projects`). It uses `process.env` +
// the Cosmos SDK (node-only), so it can't run in a client bundle regardless.
import { Agent as HttpsAgent } from "node:https";
import { CosmosClient } from "@azure/cosmos";

// The local Cosmos emulator uses a self-signed cert. Confine the TLS
// relaxation to a per-client https.Agent so it does not leak to other outbound
// HTTPS calls in the same Next.js process (the previous global
// NODE_TLS_REJECT_UNAUTHORIZED mutation did). Gated on non-prod AND a
// localhost endpoint so it can never apply to a real host.
function buildCosmosClient(endpoint: string, key: string): CosmosClient {
	let host = "";
	let isHttps = false;
	try {
		const url = new URL(endpoint);
		host = url.hostname;
		isHttps = url.protocol === "https:";
	} catch {
		// fall through — host stays "" and the relaxations stay disabled
	}
	const isLocalEmulator =
		host === "localhost" || host === "127.0.0.1" || host === "::1";
	const relaxForEmulator =
		process.env.NODE_ENV !== "production" && isLocalEmulator;
	// The local Cosmos emulator comes in two flavors:
	//  - classic HTTPS + self-signed cert → confine TLS relaxation to a per-client
	//    https.Agent so it can't leak to other outbound HTTPS calls in this process.
	//  - vnext-preview, served plain HTTP on :8081 → pass NO agent; an https.Agent
	//    breaks an http:// endpoint, and the SDK already permits insecure http for
	//    http URLs at the request layer (RequestHandler sets allowInsecureConnection
	//    from the URL protocol).
	// Gated on non-prod AND a localhost endpoint, so the relaxation can never
	// apply to a real host.
	const agent =
		relaxForEmulator && isHttps
			? new HttpsAgent({ rejectUnauthorized: false })
			: undefined;
	return new CosmosClient({ endpoint, key, agent });
}

/**
 * Typed error for "not found or forbidden" responses from Cosmos ownership
 * checks. Using a class (instead of an inline `Error & { code: number }` cast)
 * lets callers use `instanceof` for reliable narrowing rather than duck-typing
 * on `.code`, and avoids the unsafe `as` cast at every throw site.
 */
export class NotFoundOrForbiddenError extends Error {
	readonly code = 404 as const;
	constructor() {
		super("Not found or forbidden");
		this.name = "NotFoundOrForbiddenError";
	}
}

/**
 * Minimal server-side Cosmos client for Agora's Compose projects directory.
 *
 * Ported (trimmed) from socratics-v2-frontend's
 * `src/server/cosmos/financialModels.ts`. Agora only needs the directory-list
 * read today, so this is scoped to `listProjectsForUser` + the lean projection;
 * the full read/patch/create surface comes with the Compose-workflow migration
 * (Phase 3). By application invariant, `id == project_id` — v2-frontend's
 * `buildCanonicalDoc` stamp writes them equal; the partition key is
 * `/project_id`. The canonical doc is the single source of truth for project
 * directory metadata. See docs/project-directory-store-decision.md
 * (v2-frontend repo) — this supersedes `task_3.1_target_architecture.md` §9,
 * which placed the directory row in Postgres.
 *
 * Env: COSMOS_ENDPOINT, COSMOS_KEY, COSMOS_DATABASE (default "financial_models"),
 * COSMOS_CONTAINER (default "financial_models"). Dev uses the same instance as
 * v2-frontend (db "socratics-documents", container "financial_models").
 */

/**
 * Lean projection of a canonical document for the project-directory list —
 * only the fields the projects page needs, never the heavy `statements`
 * payload. `name` is `metadata.name` (projected via `AS name`);
 * `sources[].filename` are the uploaded source files.
 */
export interface ProjectDirectoryDoc {
	id: string;
	project_id?: string;
	projectId?: string;
	tenant_id?: string;
	owner_user_id?: string;
	acl?: { owners?: string[] };
	document_type?: string;
	status?: string;
	deleted_at?: string;
	deleted_by?: string;
	updated_at?: string;
	name?: string;
	sources?: Array<{ filename?: string } | null> | null;
}

export class FinancialModelsContainer {
	private constructor(
		private readonly cosmosContainer: ReturnType<
			ReturnType<CosmosClient["database"]>["container"]
		>,
	) {}

	private static _initialized = false;

	// Dev: reuse the same instance across Next.js HMR cycles to avoid opening a
	// new HTTP/2 connection on every route invocation.
	static fromEnv(): FinancialModelsContainer {
		if (process.env.NODE_ENV !== "production") {
			const g = globalThis as { __cosmos?: FinancialModelsContainer };
			if (!g.__cosmos) g.__cosmos = FinancialModelsContainer._build();
			return g.__cosmos;
		}
		return FinancialModelsContainer._build();
	}

	/**
	 * Ensure the Cosmos database and container exist (dev/emulator only).
	 * Safe to call multiple times — no-ops after the first successful run.
	 */
	async ensureExists(): Promise<void> {
		if (FinancialModelsContainer._initialized) return;
		if (process.env.NODE_ENV === "production") {
			FinancialModelsContainer._initialized = true;
			return;
		}
		const endpoint = process.env.COSMOS_ENDPOINT;
		const key = process.env.COSMOS_KEY;
		if (!endpoint || !key) return;

		const client = buildCosmosClient(endpoint, key);
		const dbName = process.env.COSMOS_DATABASE ?? "financial_models";
		const containerName = process.env.COSMOS_CONTAINER ?? "financial_models";

		const { database } = await client.databases.createIfNotExists({ id: dbName });
		await database.containers.createIfNotExists({
			id: containerName,
			partitionKey: { paths: ["/project_id"] },
		});
		FinancialModelsContainer._initialized = true;
	}

	/**
	 * Cheap reachability probe for health checks: reads the container's own
	 * metadata (a single low-RU request). Throws if Cosmos is unreachable or
	 * credentials are invalid. Used by GET /api/health so app liveness tracks
	 * the canonical store (Cosmos) rather than Hasura, which is being retired.
	 *
	 * ensureExists() first so a fresh local emulator (container not yet created
	 * until the first listProjectsForUser) doesn't make the health check 503 —
	 * it's a no-op in production and after the first successful run.
	 */
	async ping(): Promise<void> {
		await this.ensureExists();
		await this.cosmosContainer.read();
	}

	private static _build(): FinancialModelsContainer {
		const endpoint = process.env.COSMOS_ENDPOINT;
		const key = process.env.COSMOS_KEY;
		if (!endpoint || !key) {
			throw new Error("COSMOS_ENDPOINT and COSMOS_KEY must be set in environment");
		}
		const client = buildCosmosClient(endpoint, key);
		const db = process.env.COSMOS_DATABASE ?? "financial_models";
		const container = process.env.COSMOS_CONTAINER ?? "financial_models";
		return new FinancialModelsContainer(client.database(db).container(container));
	}

	/**
	 * List the canonical project documents the user owns, for the directory page.
	 *
	 * Cross-partition query (the container is partitioned by `/project_id`, but
	 * the directory question is "my projects", not "this project"). Cheap at
	 * today's single-physical-partition scale; the durable design replaces this
	 * with a change-feed read model.
	 *
	 * Scoping: `tenant_id` match + the user is an owner — either on the per-doc
	 * ACL (`acl.owners`, which replaces Hasura RLS) or the legacy `owner_user_id`
	 * scalar. `document_type = "financial_model"` excludes any non-canonical rows.
	 * `ownerUserId` is the Auth0 sub (`IdentityUser.external_id`).
	 *
	 * Soft-deleted documents (those with a `deleted_at` field) are excluded so
	 * they never appear in the directory list.
	 *
	 * Projects only the directory fields — never `statements` — to keep the list
	 * payload small. (No `enableCrossPartitionQuery` flag: @azure/cosmos v4 fans
	 * out automatically when the query doesn't filter on the partition key.)
	 */
	async listProjectsForUser(args: {
		ownerUserId: string;
		tenantId: string;
	}): Promise<ProjectDirectoryDoc[]> {
		const { resources } = await this.cosmosContainer.items
			.query<ProjectDirectoryDoc>({
				query: `
					SELECT c.id, c.project_id, c.projectId, c.status, c.updated_at,
					       c.metadata.name AS name, c.sources
					FROM c
					WHERE c.tenant_id = @tenantId
					  AND c.document_type = "financial_model"
					  AND (ARRAY_CONTAINS(c.acl.owners, @ownerUserId) OR c.owner_user_id = @ownerUserId)
					  AND NOT IS_DEFINED(c.deleted_at)
				`,
				parameters: [
					{ name: "@tenantId", value: args.tenantId },
					{ name: "@ownerUserId", value: args.ownerUserId },
				],
			})
			.fetchAll();
		return resources;
	}

	/**
	 * Soft-delete the canonical document for a project.
	 *
	 * Performs an ownership check before mutating: reads the document and
	 * verifies both `tenant_id` matches and `ownerUserId` is listed in
	 * `acl.owners` or `owner_user_id`. Throws a NOT_FOUND_OR_FORBIDDEN error
	 * (code 404) for any mismatch so callers cannot use this as an existence
	 * oracle for documents they don't own.
	 *
	 * On success, patches the document with `deleted_at`, `deleted_by`, and
	 * `status: "deleted"` rather than physically removing it. The list query
	 * filters `IS_DEFINED(c.deleted_at)`, so soft-deleted projects are
	 * transparent to the directory UI.
	 *
	 * By application invariant, `id == project_id` (written by v2-frontend's
	 * `buildCanonicalDoc`). The partition key is `/project_id`, so both the item
	 * id and the partition key value are the same string.
	 */
	async deleteProject({
		projectId,
		tenantId,
		ownerUserId,
	}: {
		projectId: string;
		tenantId: string;
		ownerUserId: string;
	}): Promise<void> {
		// Read first — ownership check before any mutation.
		let doc: ProjectDirectoryDoc;
		try {
			const { resource } = await this.cosmosContainer
				.item(projectId, projectId)
				.read<ProjectDirectoryDoc>();
			if (!resource) {
				// Document doesn't exist — treat as not-found-or-forbidden.
				throw new NotFoundOrForbiddenError();
			}
			doc = resource;
		} catch (e) {
			// Re-throw our own typed error unchanged; map any Cosmos 404 to it.
			if (e instanceof NotFoundOrForbiddenError) throw e;
			const err = e as { code?: string | number };
			if (err?.code === 404 || err?.code === "404") {
				throw new NotFoundOrForbiddenError();
			}
			throw e;
		}

		// Guard: only operate on canonical financial-model documents (mirrors the
		// list query's `document_type = "financial_model"` filter).
		if (doc.document_type !== "financial_model") {
			throw new NotFoundOrForbiddenError();
		}

		// Ownership: tenant must match AND user must appear in acl.owners or
		// owner_user_id. Return the same 404 as "not found" — no existence oracle.
		const tenantMatch = doc.tenant_id === tenantId;
		const ownerMatch =
			doc.owner_user_id === ownerUserId ||
			(Array.isArray(doc.acl?.owners) && doc.acl.owners.includes(ownerUserId));

		if (!tenantMatch || !ownerMatch) {
			throw new NotFoundOrForbiddenError();
		}

		// Idempotent: if already soft-deleted, don't overwrite the original audit
		// stamp (deleted_at / deleted_by from the first delete remain canonical).
		if (doc.deleted_at) return;

		// Soft delete: patch rather than hard-remove so the document is auditable.
		// Use op:"add" for /status — it creates the field if absent (older docs may
		// not have it), and replaces it if present. op:"replace" would fail on docs
		// that never had a /status field.
		await this.cosmosContainer.item(projectId, projectId).patch([
			{ op: "add", path: "/deleted_at", value: new Date().toISOString() },
			{ op: "add", path: "/deleted_by", value: ownerUserId },
			{ op: "add", path: "/status", value: "deleted" },
		]);
	}
}
