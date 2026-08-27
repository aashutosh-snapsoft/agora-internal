/**
 * Tests for the keyless Azure Blob SAS minting (src/lib/projects/azure-blob-keyless.ts,
 * promoted from src/lib/demo/ — SCS-110/PR #569).
 *
 * Focus: the BROWSER file-browser SAS.
 *
 * Asserts the load-bearing custody properties of the browser SAS:
 *   (d) mintUserDelegationSas is short-lived (`DEFAULT_SAS_TTL_SECONDS` / 3600s),
 *       signs with the USER-DELEGATION key (getUserDelegationKey), HTTPS-only,
 *       container-scoped — NEVER the account key / connection string — and carries
 *       the `rwlc` capability widened by SENG-1027 (self-service upload). The
 *       real-SDK capability assertions for the browser SAS live in
 *       azure-blob-keyless-selfservice.test.ts, which uses the real @azure/storage-blob.
 *
 * The Azure SDK is fully mocked — no network, no real credential resolution, no live Azure.
 */

// `server-only` is a build-time marker with no runtime behavior; map it to an empty module.
jest.mock("server-only", () => ({}), { virtual: true });

// --- Mock @azure/identity: DefaultAzureCredential must be constructible, no key. ---
jest.mock("@azure/identity", () => ({
	DefaultAzureCredential: jest.fn().mockImplementation(function (this: unknown) {}),
}));

// --- Mock @azure/storage-blob: capture the SAS params, forbid the account-key path. ---
const blobFromConnectionString = jest.fn(); // must NEVER be called
const mockGenerateSas = jest.fn();

jest.mock("@azure/storage-blob", () => {
	class BlobServiceClient {
		static fromConnectionString = blobFromConnectionString;
		constructor(_url: string, _credential: unknown) {}
	}
	return {
		BlobServiceClient,
		ContainerClient: class {},
		SASProtocol: { Https: "https" },
		// parse returns a marker carrying the spec string so the test can assert scope.
		ContainerSASPermissions: {
			parse: jest.fn((spec: string) => ({ spec, toString: () => spec })),
		},
		generateBlobSASQueryParameters: mockGenerateSas,
	};
});

/** Fake user-delegation key returned by the injected client. */
const FAKE_DELEGATION_KEY = { signedObjectId: "oid", signedTenantId: "tid", value: "k" };

/** Build a fake BlobServiceClient whose getUserDelegationKey resolves the fake key. */
function fakeClient() {
	return {
		getUserDelegationKey: jest.fn().mockResolvedValue(FAKE_DELEGATION_KEY),
	} as unknown as import("@azure/storage-blob").BlobServiceClient;
}

beforeEach(() => {
	jest.clearAllMocks();
	process.env.AZURE_STORAGE_ACCOUNT = "agorademodev";
	// generateBlobSASQueryParameters echoes back a query string carrying the permission spec.
	mockGenerateSas.mockImplementation((opts: { permissions: { spec: string } }) => ({
		toString: () => `sig=fake&sp=${opts.permissions.spec}`,
	}));
});

afterEach(() => {
	delete process.env.AZURE_STORAGE_ACCOUNT;
});

describe("mintUserDelegationSas — browser SAS: rwlc capability, short (3600s) TTL", () => {
	const now = new Date("2026-07-01T00:00:00.000Z");

	it("(d) requests rwlc and a short 3600s window, keyless, and never the account key", async () => {
		const { mintUserDelegationSas, DEFAULT_SAS_TTL_SECONDS } = await import(
			"../azure-blob-keyless"
		);
		const client = fakeClient();

		const sas = await mintUserDelegationSas("demo-y-20260701000000", {
			account: "agorademodev",
			client,
			now,
		});

		// Short-lived: the browser SAS keeps the 3600s TTL — distinct from the 8h job SAS.
		expect(DEFAULT_SAS_TTL_SECONDS).toBe(3600);

		// Widened by SENG-1027: the browser SAS now carries rwlc so in-app upload works.
		const { ContainerSASPermissions } = await import("@azure/storage-blob");
		expect(ContainerSASPermissions.parse).toHaveBeenCalledWith("rwlc");

		const [sasOpts, signingKey] = mockGenerateSas.mock.calls[0];
		expect(sasOpts.permissions.spec).toBe("rwlc");
		expect(signingKey).toBe(FAKE_DELEGATION_KEY); // user-delegation signed
		expect(sasOpts.protocol).toBe("https");

		const startsMs = new Date(sas.startsOn).getTime();
		const expiresMs = new Date(sas.expiresOn).getTime();
		expect(now.getTime() - startsMs).toBe(60 * 1000);
		expect(expiresMs - now.getTime()).toBe(DEFAULT_SAS_TTL_SECONDS * 1000);

		expect(blobFromConnectionString).not.toHaveBeenCalled();
		expect(sas.sasUrl).toContain("sp=rwlc");
	});
});
