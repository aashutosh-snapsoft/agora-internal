import "server-only";
import { DefaultAzureCredential } from "@azure/identity";
import { TableClient, odata, type TableEntity } from "@azure/data-tables";
import { getStorageAccount } from "./azure-blob-keyless";

/**
 * Keyless Azure Table Storage per-user ownership registry (promoted from the
 * former demo-staging feature — SCS-110/PR #569).
 *
 * SECURITY CONTRACT (referenced historically as
 * contracts/ownership-registry-contract.md, though that file does not exist
 * anywhere in this repo's git history — see azure-blob-keyless.ts's own note
 * on this) — load-bearing:
 *   - This is the AUTHORIZATION primitive that closes the authn≠authz gap on the
 *     demo routes. Authority = `verified session` ∧ `server record owned by that
 *     session`. The owner (`PartitionKey`) is the Auth0 `session.user.sub`; a
 *     caller can only ever resolve rows inside their own partition, so
 *     cross-user access is structurally impossible (isolation is structural, not
 *     a conditional `if`). `getOwnedProject` returning `null` on a miss is the
 *     403 primitive: an absent row in the caller's partition means "not yours."
 *   - KEYLESS, same rule as the Blob plane (contracts/keyless-auth-contract.md):
 *     the TableClient is constructed from the account TABLE-endpoint URL + a
 *     DefaultAzureCredential token — NEVER a connection string, NEVER an account
 *     key, NEVER TableClient.fromConnectionString. There is intentionally no
 *     AZURE_STORAGE_CONNECTION_STRING / *_ACCOUNT_KEY env var.
 *   - The registry table lives in the SAME storage account as the Blob
 *     containers (getStorageAccount() is reused so there is no second source of
 *     truth for the account name).
 *
 * Requires the Agora identity to hold `Storage Table Data Contributor` on the
 * storage account (infra/demo-staging/rbac.bicep).
 */

/**
 * The registry table name. Kept as-is post-promotion (not worth a data
 * migration for a rename) — this table now holds real project rows, not
 * demo-staging ones.
 */
export const DEMO_PROJECTS_TABLE = "demoProjects";

/**
 * The stored registry entity. The Table-Storage system columns
 * `partitionKey` / `rowKey` carry the owner and the project (container) id;
 * `account` / `container` are explicit properties so the row is self-describing
 * (even though `rowKey === container`).
 */
export interface DemoProjectEntity {
	/** owner — the Auth0 `session.user.sub`. The authorization key. */
	partitionKey: string;
	/** project / container id — the container name. Unique per owner. */
	rowKey: string;
	/** server-stored storage account name; routes use THIS, not client input. */
	account: string;
	/** server-stored container name; routes use THIS, not client input. */
	container: string;
	/**
	 * The name the user actually typed at creation (review on PR #569, item 2):
	 * the container name itself is `proj-<slug>-<timestamp>-<random>`, not
	 * something a project card should render. Absent on rows created before
	 * this field existed; `listOwnedProjects`/`getOwnedProject` fall back to
	 * `container` for those.
	 */
	displayName?: string;
	/** ISO 8601 — when the project row was created. */
	createdAt: string;
	/** project lifecycle marker (`active`). Advisory; not load-bearing for authz. */
	status: string;
}

/** The owner-scoped projection returned by listOwnedProjects (no PK/RK leakage). */
export interface OwnedProject {
	container: string;
	account: string;
	/** The user-typed name; falls back to `container` for pre-displayName rows. */
	displayName: string;
	createdAt: string;
	status: string;
}

function accountTableUrl(account: string): string {
	return `https://${account}.table.core.windows.net`;
}

/**
 * Build the keyless TableClient: account table-endpoint URL + table name +
 * DefaultAzureCredential. NEVER TableClient.fromConnectionString — that path
 * would require an account key/connection string, which the keyless contract
 * forbids.
 */
export function getTableClient(
	table: string = DEMO_PROJECTS_TABLE,
	account: string = getStorageAccount(),
): TableClient {
	const credential = new DefaultAzureCredential();
	return new TableClient(accountTableUrl(account), table, credential);
}

/**
 * Create (idempotently) the registry row for a freshly minted project.
 * Owned by `owner` (PartitionKey), keyed by `container` (RowKey). Uses
 * upsertEntity with Merge so a re-create on the same (owner, container) is
 * idempotent rather than a 409.
 */
export async function createProject(
	args: {
		owner: string;
		container: string;
		account: string;
		displayName: string;
		now?: Date;
		client?: TableClient;
	},
): Promise<DemoProjectEntity> {
	const client = args.client ?? getTableClient();
	const createdAt = (args.now ?? new Date()).toISOString();

	const entity: TableEntity<Omit<DemoProjectEntity, "partitionKey" | "rowKey">> = {
		partitionKey: args.owner,
		rowKey: args.container,
		account: args.account,
		container: args.container,
		displayName: args.displayName,
		createdAt,
		status: "active",
	};

	await client.upsertEntity(entity, "Merge");

	return {
		partitionKey: args.owner,
		rowKey: args.container,
		account: args.account,
		container: args.container,
		displayName: args.displayName,
		createdAt,
		status: "active",
	};
}

/** True when an Azure Tables error is a not-found (ResourceNotFound / 404). */
function isNotFound(err: unknown): boolean {
	const e = err as { statusCode?: number; code?: string } | null;
	return !!e && (e.statusCode === 404 || e.code === "ResourceNotFound");
}

/**
 * Resolve the registry row by (owner, container). THE AUTHORIZATION PRIMITIVE:
 * a row only resolves inside the caller's own partition, so this returns the
 * project only when the caller owns it. Returns `null` on the Tables 404 —
 * it MUST NOT throw on a miss (the route turns `null` into a 403). It still
 * throws on non-404 errors (a real Tables/credential failure is not "forbidden").
 */
export async function getOwnedProject(
	args: { owner: string; container: string; client?: TableClient },
): Promise<DemoProjectEntity | null> {
	const client = args.client ?? getTableClient();
	try {
		const e = await client.getEntity<Omit<DemoProjectEntity, "partitionKey" | "rowKey">>(
			args.owner,
			args.container,
		);
		// PartitionKey/RowKey are the query keys (authoritative); the stored
		// account/container/createdAt/status come from the entity body.
		return {
			partitionKey: args.owner,
			rowKey: args.container,
			account: e.account,
			container: e.container,
			displayName: e.displayName,
			createdAt: e.createdAt,
			status: e.status,
		};
	} catch (err) {
		if (isNotFound(err)) {
			return null;
		}
		throw err;
	}
}

/**
 * Delete the registry row by (owner, container). Same partition-scoped shape as
 * getOwnedProject — a caller can only ever delete a row inside their own
 * partition, so cross-user deletion is structurally impossible. Returns `false`
 * on a not-found miss (idempotent; the route treats that as already-deleted) and
 * still throws on non-404 errors.
 */
export async function deleteOwnedProject(
	args: { owner: string; container: string; client?: TableClient },
): Promise<boolean> {
	const client = args.client ?? getTableClient();
	try {
		await client.deleteEntity(args.owner, args.container);
		return true;
	} catch (err) {
		if (isNotFound(err)) {
			return false;
		}
		throw err;
	}
}

/**
 * Count the caller's OWN projects (PartitionKey eq '<owner>'), for enforcing
 * the per-user creation cap in POST /api/projects/container (PR #569
 * re-review, open question C: Auth0 self-signup is open, so an unbounded
 * per-user creation endpoint is a real abuse surface, not just a hygiene
 * concern — this is required, not a nice-to-have).
 *
 * Selects only `rowKey` — same filtered partition scan as listOwnedProjects,
 * but without pulling the rest of each row's fields across the wire just to
 * count them.
 */
export async function countOwnedProjects(
	args: { owner: string; client?: TableClient },
): Promise<number> {
	const client = args.client ?? getTableClient();
	let count = 0;
	const iter = client.listEntities({
		queryOptions: { filter: odata`PartitionKey eq ${args.owner}`, select: ["rowKey"] },
	});
	for await (const _e of iter) {
		count++;
	}
	return count;
}

/**
 * List the caller's OWN projects: a Table query filtered to
 * `PartitionKey eq '<owner>'`. No cross-partition query is ever issued. Returns
 * an owner-scoped projection, newest first.
 */
export async function listOwnedProjects(
	args: { owner: string; client?: TableClient },
): Promise<OwnedProject[]> {
	const client = args.client ?? getTableClient();

	const rows: OwnedProject[] = [];
	const iter = client.listEntities<Omit<DemoProjectEntity, "partitionKey" | "rowKey">>({
		queryOptions: { filter: odata`PartitionKey eq ${args.owner}` },
	});
	for await (const e of iter) {
		rows.push({
			container: e.container,
			account: e.account,
			// Falls back to the container id for rows created before displayName
			// existed — never leaves a card with nothing to show.
			displayName: e.displayName ?? e.container,
			createdAt: e.createdAt,
			status: e.status,
		});
	}

	rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	return rows;
}
