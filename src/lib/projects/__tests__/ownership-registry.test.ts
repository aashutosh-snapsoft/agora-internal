/**
 * Tests for the keyless Azure Table Storage per-user ownership registry
 * (src/lib/projects/ownership-registry.ts, promoted from src/lib/demo/ —
 * SCS-110/PR #569).
 *
 * Asserts the load-bearing security properties of the registry — the
 * authorization primitive that closes the authn≠authz gap on the routes it backs:
 *   (a) The TableClient is constructed KEYLESS: the account TABLE-endpoint URL +
 *       a DefaultAzureCredential token. The account-key path is NEVER taken
 *       (TableClient.fromConnectionString is never called).
 *   (b) createProject writes an entity with partitionKey===owner,
 *       rowKey===container, and the stored account/container/createdAt/status.
 *   (c) getOwnedProject returns the entity on a hit and `null` (NOT a throw) on a
 *       Tables 404 — `null` is the 403 primitive. A non-404 error still throws.
 *   (d) listOwnedProjects issues a `PartitionKey eq '<owner>'` filtered query and
 *       returns only the owner-scoped projection.
 *
 * The Azure SDK is fully mocked — no network, no real credential resolution.
 */

// `server-only` is a build-time marker with no runtime behavior; in the jest
// node env it has no module to resolve, so map it to an empty module.
jest.mock("server-only", () => ({}), { virtual: true });

// --- Mock @azure/identity: DefaultAzureCredential must be constructible, no key. ---
const registryDefaultAzureCredentialCtor = jest.fn();
jest.mock("@azure/identity", () => ({
	DefaultAzureCredential: jest.fn().mockImplementation(function (this: unknown) {
		registryDefaultAzureCredentialCtor();
	}),
}));

// --- Mock @azure/data-tables ---
const tableClientCtor = jest.fn();
const registryFromConnectionString = jest.fn(); // must NEVER be called
const mockUpsertEntity = jest.fn().mockResolvedValue({});
const mockGetEntity = jest.fn();
const mockListEntities = jest.fn();

jest.mock("@azure/data-tables", () => {
	class TableClient {
		static fromConnectionString = registryFromConnectionString;
		constructor(url: string, table: string, credential: unknown) {
			tableClientCtor(url, table, credential);
		}
		upsertEntity = mockUpsertEntity;
		getEntity = mockGetEntity;
		listEntities = mockListEntities;
	}
	return {
		TableClient,
		// `odata` template tag — record the interpolated filter string the SUT builds.
		odata: (strings: TemplateStringsArray, ...values: unknown[]) =>
			strings.reduce(
				(acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ""),
				"",
			),
	};
});

/** Build an async-iterable that yields the given entities (what listEntities returns). */
function asyncIterableOf<T>(items: T[]): AsyncIterable<T> {
	return {
		async *[Symbol.asyncIterator]() {
			for (const item of items) {
				yield item;
			}
		},
	};
}

beforeEach(() => {
	jest.clearAllMocks();
	process.env.AZURE_STORAGE_ACCOUNT = "socraticsdemostg";
	jest.spyOn(console, "error").mockImplementation();
});

afterEach(() => {
	delete process.env.AZURE_STORAGE_ACCOUNT;
	jest.restoreAllMocks();
});

describe("ownership-registry — keyless construction", () => {
	it("(a) builds the TableClient from the account table-endpoint URL + DefaultAzureCredential (never fromConnectionString)", async () => {
		const { getTableClient } = await import("../ownership-registry");

		getTableClient();

		// The account-key constructor is never used.
		expect(registryFromConnectionString).not.toHaveBeenCalled();

		// TableClient is built from the TABLE-endpoint URL + table name + a token credential.
		expect(registryDefaultAzureCredentialCtor).toHaveBeenCalled();
		expect(tableClientCtor).toHaveBeenCalledTimes(1);
		const [url, table, credential] = tableClientCtor.mock.calls[0];
		expect(url).toBe("https://socraticsdemostg.table.core.windows.net");
		expect(table).toBe("demoProjects");
		expect(credential).toBeDefined();
	});
});

describe("ownership-registry — createProject", () => {
	it("(b) upserts an entity with partitionKey===owner, rowKey===container, and the stored fields", async () => {
		const { createProject } = await import("../ownership-registry");
		const now = new Date("2026-06-25T12:00:00.000Z");

		const result = await createProject({
			owner: "auth0|abc",
			container: "demo-secrettoken-20260625120000",
			account: "socraticsdemostg",
			displayName: "Acme QoE Review",
			now,
		});

		expect(mockUpsertEntity).toHaveBeenCalledTimes(1);
		const [entity, mode] = mockUpsertEntity.mock.calls[0];
		expect(entity.partitionKey).toBe("auth0|abc");
		expect(entity.rowKey).toBe("demo-secrettoken-20260625120000");
		expect(entity.account).toBe("socraticsdemostg");
		expect(entity.container).toBe("demo-secrettoken-20260625120000");
		expect(entity.displayName).toBe("Acme QoE Review");
		expect(entity.createdAt).toBe("2026-06-25T12:00:00.000Z");
		expect(entity.status).toBe("active");
		// Merge upsert keeps re-create idempotent.
		expect(mode).toBe("Merge");

		// The returned record mirrors what was written.
		expect(result.partitionKey).toBe("auth0|abc");
		expect(result.rowKey).toBe("demo-secrettoken-20260625120000");
		expect(result.displayName).toBe("Acme QoE Review");
		expect(result.status).toBe("active");
		expect(result.createdAt).toBe("2026-06-25T12:00:00.000Z");

		// Never the account-key path.
		expect(registryFromConnectionString).not.toHaveBeenCalled();
	});
});

describe("ownership-registry — getOwnedProject (the 403 primitive)", () => {
	it("(c1) returns the entity on a hit, resolved by (owner, container)", async () => {
		mockGetEntity.mockResolvedValueOnce({
			partitionKey: "auth0|abc",
			rowKey: "demo-x-20260625120000",
			account: "socraticsdemostg",
			container: "demo-x-20260625120000",
			createdAt: "2026-06-25T12:00:00.000Z",
			status: "active",
		});
		const { getOwnedProject } = await import("../ownership-registry");

		const result = await getOwnedProject({
			owner: "auth0|abc",
			container: "demo-x-20260625120000",
		});

		expect(mockGetEntity).toHaveBeenCalledWith("auth0|abc", "demo-x-20260625120000");
		expect(result).not.toBeNull();
		expect(result?.partitionKey).toBe("auth0|abc");
		expect(result?.container).toBe("demo-x-20260625120000");
		expect(result?.account).toBe("socraticsdemostg");
	});

	it("(c2) returns null (does NOT throw) on a Tables 404 — the not-found path is the 403 primitive", async () => {
		const notFound = Object.assign(new Error("ResourceNotFound"), {
			statusCode: 404,
			code: "ResourceNotFound",
		});
		mockGetEntity.mockRejectedValueOnce(notFound);
		const { getOwnedProject } = await import("../ownership-registry");

		const result = await getOwnedProject({
			owner: "auth0|other",
			container: "demo-x-20260625120000",
		});

		expect(result).toBeNull();
	});

	it("(c3) rethrows a non-404 error (a real failure is not 'forbidden')", async () => {
		const serverErr = Object.assign(new Error("ServerBusy"), {
			statusCode: 503,
			code: "ServerBusy",
		});
		mockGetEntity.mockRejectedValueOnce(serverErr);
		const { getOwnedProject } = await import("../ownership-registry");

		await expect(
			getOwnedProject({ owner: "auth0|abc", container: "demo-x-20260625120000" }),
		).rejects.toThrow("ServerBusy");
	});
});

describe("ownership-registry — listOwnedProjects", () => {
	it("(d) issues a `PartitionKey eq '<owner>'` query and returns the owner-scoped projection, newest first", async () => {
		mockListEntities.mockReturnValueOnce(
			asyncIterableOf([
				{
					partitionKey: "auth0|abc",
					rowKey: "demo-old-20260101000000",
					account: "socraticsdemostg",
					container: "demo-old-20260101000000",
					displayName: "Old Deal",
					createdAt: "2026-01-01T00:00:00.000Z",
					status: "active",
				},
				{
					partitionKey: "auth0|abc",
					rowKey: "demo-new-20260625120000",
					account: "socraticsdemostg",
					container: "demo-new-20260625120000",
					displayName: "Acme QoE Review",
					createdAt: "2026-06-25T12:00:00.000Z",
					status: "active",
				},
			]),
		);
		const { listOwnedProjects } = await import("../ownership-registry");

		const rows = await listOwnedProjects({ owner: "auth0|abc" });

		// Owner-scoped filter (PartitionKey eq owner) was issued.
		expect(mockListEntities).toHaveBeenCalledTimes(1);
		const [opts] = mockListEntities.mock.calls[0];
		expect(opts.queryOptions.filter).toBe("PartitionKey eq auth0|abc");

		// Newest first, and only the projected fields (no partitionKey/rowKey leakage).
		expect(rows).toHaveLength(2);
		expect(rows[0].container).toBe("demo-new-20260625120000");
		expect(rows[1].container).toBe("demo-old-20260101000000");
		expect(rows[0]).toEqual({
			container: "demo-new-20260625120000",
			account: "socraticsdemostg",
			displayName: "Acme QoE Review",
			createdAt: "2026-06-25T12:00:00.000Z",
			status: "active",
		});
		expect(rows[0]).not.toHaveProperty("partitionKey");
		expect(rows[0]).not.toHaveProperty("rowKey");
	});

	it("falls back to the container id as displayName for rows created before that field existed", async () => {
		mockListEntities.mockReturnValueOnce(
			asyncIterableOf([
				{
					partitionKey: "auth0|abc",
					rowKey: "demo-pre-existing-20260101000000",
					account: "socraticsdemostg",
					container: "demo-pre-existing-20260101000000",
					// displayName intentionally absent — a row from before it existed.
					createdAt: "2026-01-01T00:00:00.000Z",
					status: "active",
				},
			]),
		);
		const { listOwnedProjects } = await import("../ownership-registry");

		const rows = await listOwnedProjects({ owner: "auth0|abc" });

		expect(rows[0].displayName).toBe("demo-pre-existing-20260101000000");
	});
});

describe("ownership-registry — countOwnedProjects (per-user cap backstop)", () => {
	it("issues the same owner-scoped `PartitionKey eq '<owner>'` filter and counts the rows", async () => {
		mockListEntities.mockReturnValueOnce(
			asyncIterableOf([
				{ rowKey: "demo-a-20260101000000" },
				{ rowKey: "demo-b-20260102000000" },
				{ rowKey: "demo-c-20260103000000" },
			]),
		);
		const { countOwnedProjects } = await import("../ownership-registry");

		const count = await countOwnedProjects({ owner: "auth0|abc" });

		expect(count).toBe(3);
		expect(mockListEntities).toHaveBeenCalledTimes(1);
		const [opts] = mockListEntities.mock.calls[0];
		expect(opts.queryOptions.filter).toBe("PartitionKey eq auth0|abc");
		// Only rowKey is selected — no need to pull the full row just to count it.
		expect(opts.queryOptions.select).toEqual(["rowKey"]);
	});

	it("returns 0 for an owner with no rows", async () => {
		mockListEntities.mockReturnValueOnce(asyncIterableOf([]));
		const { countOwnedProjects } = await import("../ownership-registry");

		const count = await countOwnedProjects({ owner: "auth0|new-user" });

		expect(count).toBe(0);
	});
});
