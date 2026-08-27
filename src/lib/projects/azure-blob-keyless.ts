import "server-only";
import { randomBytes } from "node:crypto";
import { DefaultAzureCredential } from "@azure/identity";
import {
	BlobServiceClient,
	ContainerClient,
	ContainerSASPermissions,
	SASProtocol,
	generateBlobSASQueryParameters,
	type UserDelegationKey,
} from "@azure/storage-blob";

/**
 * Keyless Azure Blob plane for per-project storage (promoted from the former
 * demo-staging feature — SCS-110/PR #569).
 *
 * SECURITY CONTRACT (referenced historically as contracts/keyless-auth-contract.md,
 * though that file does not exist anywhere in this repo's git history — either
 * external documentation this repo never had a copy of, or aspirational; the
 * invariants below are what's actually load-bearing regardless) — load-bearing:
 *   - No account key. No connection string. Ever. There is intentionally NO
 *     AZURE_STORAGE_CONNECTION_STRING / *_ACCOUNT_KEY env var (see config-env.yaml).
 *   - Every Blob operation authenticates via Azure AD identity resolved by
 *     DefaultAzureCredential (managed identity in prod; service principal in
 *     local/dev via the standard AZURE_CLIENT_ID/TENANT_ID/CLIENT_SECRET trio
 *     the Azure SDK already standardizes — we invent no new env names).
 *   - The handed-out SAS is a USER-DELEGATION SAS (signed with a user-delegation
 *     KEY from getUserDelegationKey(), NOT the account key), scoped to the single
 *     per-project container, read+write+list+create (NO delete, NO append — least
 *     privilege for self-service list/upload/download), short-lived.
 *
 * The BlobServiceClient is constructed from the account URL + the token
 * credential — NEVER BlobServiceClient.fromConnectionString.
 */

/**
 * Container naming convention — was frozen at contracts/_MANIFEST.yaml
 * `container_naming` ("demo-<unguessable-slug>-<yyyymmddHHMMSS>"), but that
 * file doesn't exist anywhere in this repo's history (confirmed via a full
 * git log search) — it's either external documentation this repo never had
 * a copy of, or was aspirational. Documenting the ACTUAL convention here
 * instead, now: "proj-<slug>-<yyyymmddHHMMSS>-<6 random hex chars>".
 *
 * Two changes from the demo-era convention, both security-load-bearing
 * (review on PR #569, item 1):
 *   - The random suffix restores unguessability. The demo-era version fed a
 *     fixed per-deploy token (e.g. "qoe") into the slug; this promotion now
 *     feeds the user-typed project name instead, which is fully guessable/
 *     predictable — two users typing the same name in the same second would
 *     otherwise collide onto the very same container.
 *   - `createPrivateContainer` (below) now fails loudly on a genuine
 *     collision instead of silently succeeding via `createIfNotExists` —
 *     defense in depth on top of the near-zero collision odds the random
 *     suffix already gives.
 *
 * Prefix changed from "demo" to "proj": these are now permanent production
 * engagement containers, not demo-staging ones, and the old prefix would
 * otherwise ship real customer documents under a "demo-*" name forever
 * (containers are never renamed after creation).
 */
const CONTAINER_PREFIX = "proj";

/** Length of the random suffix `buildContainerName` appends, in hex characters. */
const RANDOM_SUFFIX_HEX_LENGTH = 6;

function randomSuffix(): string {
	// 6 hex chars = 24 bits of entropy — combined with second-granularity
	// timestamp collisions are astronomically unlikely; createPrivateContainer
	// still fails loudly rather than assuming that's enough on its own.
	return randomBytes(4).toString("hex").slice(0, RANDOM_SUFFIX_HEX_LENGTH);
}

/** Default SAS lifetime, kept <= 1 hour; see PR #569 review item on promoting a re-mint route. */
export const DEFAULT_SAS_TTL_SECONDS = 3600;

/** A small clock-skew backdate so a freshly minted SAS is valid immediately. */
const SAS_START_SKEW_SECONDS = 60;

export interface ContainerSas {
	/** Storage account name (no key). */
	account: string;
	/** Per-project private container name. */
	container: string;
	/** User-delegation SAS URL, container-scoped, read+write+list+create (no delete/append), short-lived. Powers the in-app file browser. */
	sasUrl: string;
	/** When the SAS becomes valid (ISO 8601). */
	startsOn: string;
	/** When the SAS expires (ISO 8601). */
	expiresOn: string;
}

/**
 * Read the storage account NAME from env. There is no key/connection-string var
 * by design; this is the only Azure storage identifier we read.
 */
export function getStorageAccount(): string {
	const account = process.env.AZURE_STORAGE_ACCOUNT;
	if (!account) {
		throw new Error(
			"AZURE_STORAGE_ACCOUNT is not set. Set the storage account NAME (no key, no connection string).",
		);
	}
	return account;
}

function accountBlobUrl(account: string): string {
	return `https://${account}.blob.core.windows.net`;
}

/**
 * Build the keyless BlobServiceClient: account URL + DefaultAzureCredential.
 * NEVER fromConnectionString — that path would require an account key/connection
 * string, which the keyless contract forbids.
 */
export function getBlobServiceClient(account = getStorageAccount()): BlobServiceClient {
	const credential = new DefaultAzureCredential();
	return new BlobServiceClient(accountBlobUrl(account), credential);
}

/**
 * Generate a container name for a fresh project:
 *   proj-<slug>-<yyyymmddHHMMSS>-<random>
 * Lowercased and trimmed to Azure's blob-container rules (3-63 chars,
 * lowercase letters / digits / single hyphens). `slug` is the user-typed
 * project name — NOT unguessable on its own (see the CONTAINER_PREFIX doc
 * comment) — the random suffix is what restores that property.
 */
export function buildContainerName(slug: string, now: Date = new Date()): string {
	const ts =
		`${now.getUTCFullYear()}` +
		`${String(now.getUTCMonth() + 1).padStart(2, "0")}` +
		`${String(now.getUTCDate()).padStart(2, "0")}` +
		`${String(now.getUTCHours()).padStart(2, "0")}` +
		`${String(now.getUTCMinutes()).padStart(2, "0")}` +
		`${String(now.getUTCSeconds()).padStart(2, "0")}`;
	const rand = randomSuffix();

	const cleanSlug = slug
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	let name = `${CONTAINER_PREFIX}-${cleanSlug}-${ts}-${rand}`;
	// Collapse any accidental double hyphens and enforce the 63-char ceiling.
	name = name.replace(/-{2,}/g, "-");
	if (name.length > 63) {
		// Trim the slug portion, never the timestamp/random suffix (keeps uniqueness).
		const suffix = `-${ts}-${rand}`;
		const room = 63 - (CONTAINER_PREFIX.length + 1) - suffix.length;
		const trimmedSlug = cleanSlug.slice(0, Math.max(1, room)).replace(/-+$/g, "");
		name = `${CONTAINER_PREFIX}-${trimmedSlug}${suffix}`;
	}
	return name;
}

/** Raised by {@link createPrivateContainer} on a genuine name collision — the
 * caller (createContainerWithSas) retries with a freshly-suffixed name rather
 * than silently reusing whatever already exists at that name. */
export class ContainerNameCollisionError extends Error {
	constructor(readonly containerName: string) {
		super(`Container "${containerName}" already exists.`);
		this.name = "ContainerNameCollisionError";
	}
}

/** True when the Azure SDK error is a container-already-exists conflict (HTTP 409). */
function isContainerAlreadyExistsError(err: unknown): boolean {
	const e = err as { statusCode?: number; code?: string; details?: { errorCode?: string } } | null;
	return (
		!!e &&
		(e.statusCode === 409 ||
			e.code === "ContainerAlreadyExists" ||
			e.details?.errorCode === "ContainerAlreadyExists")
	);
}

/**
 * Create a PRIVATE per-project container (no public access). Returns the
 * ContainerClient on success.
 *
 * Uses `.create()`, NOT `.createIfNotExists()` — the latter silently succeeds
 * when the name already exists, which (review on PR #569, item 1) let two
 * users who produced the same container name both end up with a valid
 * ownership row and a live read/write SAS for the SAME container: each could
 * read the other's uploads, either could delete it. A genuine collision must
 * surface as {@link ContainerNameCollisionError} so the caller retries with a
 * fresh name instead of silently sharing whatever already exists.
 */
export async function createPrivateContainer(
	containerName: string,
	client: BlobServiceClient = getBlobServiceClient(),
): Promise<ContainerClient> {
	const containerClient = client.getContainerClient(containerName);
	try {
		// No `access` option => private container (no anonymous/public access).
		await containerClient.create();
	} catch (err) {
		if (isContainerAlreadyExistsError(err)) {
			throw new ContainerNameCollisionError(containerName);
		}
		throw err;
	}
	return containerClient;
}

/**
 * Shared keyless signing core for every container-scoped user-delegation SAS this
 * module mints. Defined ONCE so the security-load-bearing invariants — user-delegation
 * signing (NEVER the account key), HTTPS-only, container scope, immediate-validity skew —
 * cannot drift across call sites (currently the browser file-browser SAS, `rwlc` /
 * short-lived, SENG-1027 self-service).
 *
 * Keyless mechanics:
 *   1. getUserDelegationKey(start, expiry) — requires the `Storage Blob Delegator`
 *      role (generateUserDelegationKey/action). This is the non-obvious RBAC the
 *      Bicep MUST grant; without it this call fails even though container CRUD works.
 *   2. generateBlobSASQueryParameters({...}, userDelegationKey, accountName) — signs
 *      the SAS with the delegation KEY, NOT the account key.
 *
 * `permissionsSpec` is a ContainerSASPermissions parse string (e.g. "rl", "rwlc"); the
 * caller — never this core — decides the least-privilege scope for its use case.
 */
async function mintContainerDelegationSas(
	containerName: string,
	permissionsSpec: string,
	ttlSeconds: number,
	opts: {
		account?: string;
		client?: BlobServiceClient;
		now?: Date;
	} = {},
): Promise<ContainerSas> {
	const account = opts.account ?? getStorageAccount();
	const client = opts.client ?? getBlobServiceClient(account);
	const now = opts.now ?? new Date();

	const startsOn = new Date(now.getTime() - SAS_START_SKEW_SECONDS * 1000);
	const expiresOn = new Date(now.getTime() + ttlSeconds * 1000);

	// (1) keyless signing key — requires Storage Blob Delegator.
	const userDelegationKey: UserDelegationKey = await client.getUserDelegationKey(
		startsOn,
		expiresOn,
	);

	const permissions = ContainerSASPermissions.parse(permissionsSpec);

	// (2) sign with the delegation key (NOT the account key).
	const sasQueryParameters = generateBlobSASQueryParameters(
		{
			containerName,
			permissions,
			protocol: SASProtocol.Https,
			startsOn,
			expiresOn,
		},
		userDelegationKey,
		account,
	);

	const sasUrl = `${accountBlobUrl(account)}/${containerName}?${sasQueryParameters.toString()}`;

	return {
		account,
		container: containerName,
		sasUrl,
		startsOn: startsOn.toISOString(),
		expiresOn: expiresOn.toISOString(),
	};
}

/**
 * Mint the BROWSER SAS handed to the client for self-service list/upload/download:
 * read+write+list+create (`rwlc`, NO delete/append — least privilege), short-lived
 * (`DEFAULT_SAS_TTL_SECONDS` / 3600s). Used by `/api/projects/container` and
 * `/api/projects/reopen`.
 *
 * Widened from `rl` to `rwlc` by SENG-1027 so the in-app file browser can upload
 * directly with the handed-out SAS; the short TTL is deliberately preserved.
 */
export async function mintUserDelegationSas(
	containerName: string,
	opts: {
		account?: string;
		client?: BlobServiceClient;
		ttlSeconds?: number;
		now?: Date;
	} = {},
): Promise<ContainerSas> {
	// read + write + list + create — self-service list/upload/download.
	// Explicitly NO delete ('d') / append ('a') — least privilege.
	return mintContainerDelegationSas(
		containerName,
		"rwlc",
		opts.ttlSeconds ?? DEFAULT_SAS_TTL_SECONDS,
		{ account: opts.account, client: opts.client, now: opts.now },
	);
}

/** Bounded retry count for a container-name collision — see createContainerWithSas. */
const MAX_CREATE_ATTEMPTS = 3;

/**
 * Create a private container AND mint its read+write+list+create user-delegation
 * SAS in one step. Returns the { account, container, sas_url }-shaped payload.
 *
 * Retries on {@link ContainerNameCollisionError} with a fresh name (a new call
 * to buildContainerName mints a new random suffix even for the same `slug`/
 * `now`) — the random suffix already makes a real collision astronomically
 * unlikely, this is defense in depth, not the primary safeguard.
 */
export async function createContainerWithSas(
	slug: string,
	opts: { ttlSeconds?: number; now?: Date; client?: BlobServiceClient } = {},
): Promise<ContainerSas> {
	const account = getStorageAccount();
	const client = opts.client ?? getBlobServiceClient(account);

	let containerName: string | undefined;
	for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
		const candidate = buildContainerName(slug, opts.now ?? new Date());
		try {
			await createPrivateContainer(candidate, client);
			containerName = candidate;
			break;
		} catch (err) {
			const isLastAttempt = attempt === MAX_CREATE_ATTEMPTS - 1;
			if (err instanceof ContainerNameCollisionError && !isLastAttempt) {
				continue;
			}
			throw err;
		}
	}
	if (!containerName) {
		// Unreachable in practice — the loop above always either returns via
		// `break` or throws — but keeps control-flow analysis happy.
		throw new Error("Failed to create a unique project container.");
	}

	return mintUserDelegationSas(containerName, {
		account,
		client,
		ttlSeconds: opts.ttlSeconds,
		now: opts.now,
	});
}
