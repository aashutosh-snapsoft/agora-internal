/**
 * Tests for POST /api/projects/container — the keyless container+SAS route.
 * Ported from the deleted demo-staging route's suite (PR #569 review, blocking
 * item 3) with the token/slug gate removed (this route is session-gated only,
 * via src/middleware.ts's /projects check) and the collision-safety changes
 * (item 1) reflected: `.create()` not `.createIfNotExists()`, and the
 * container name now carries a random suffix.
 *
 * Asserts the load-bearing security properties of the keyless Blob plane:
 *   (a) 401 without an Auth0 session.
 *   (b) On a valid session the container is created and the SAS is minted via the
 *       USER-DELEGATION path (getUserDelegationKey is called), and the ownership
 *       row is stamped with the user-typed displayName.
 *   (c) The account-key path is NEVER taken (BlobServiceClient.fromConnectionString
 *       is never called; generateBlobSASQueryParameters is signed with the
 *       user-delegation key, not an account-key credential).
 *   (d) The SAS permissions parsed are read+write+list+create ("rwlc") — widened by
 *       SENG-1027 for in-app self-service upload; still no delete/append.
 *   (e) A genuine name collision (`.create()` throws 409) retries with a fresh
 *       random suffix rather than silently reusing the existing container.
 *   (f) The per-user creation cap (PR #569 re-review, open question C — Auth0
 *       self-signup is open) 429s once the caller is at/over the limit, BEFORE
 *       any container is created, and does not apply to callers under it.
 *
 * The Azure SDK is fully mocked — no network, no real credential resolution.
 */

// Real top-level import (not just the inline `import("next/server").NextRequest`
// type references below) — makes this file an ES module in TS's eyes, so its
// top-level consts/functions (mockGetSession, makeRequest, ...) get their own
// module scope instead of colliding with same-named globals in sibling script-
// mode test files (this is what "Cannot redeclare block-scoped variable" was).
import type { NextRequest } from "next/server";

// `server-only` is a build-time marker with no runtime behavior; in the jest
// node env it has no module to resolve, so map it to an empty module.
jest.mock("server-only", () => ({}), { virtual: true });

// --- Mock auth0 (house pattern: auth0.getSession) ---
const mockGetSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
	auth0: { getSession: (...args: unknown[]) => mockGetSession(...args) },
}));

// --- Mock the ownership registry: the container route STAMPS the owner row,
// and counts the caller's existing rows to enforce the per-user cap. ---
const mockCreateProject = jest.fn().mockResolvedValue(undefined);
const mockCountOwnedProjects = jest.fn().mockResolvedValue(0);
jest.mock("@/lib/projects/ownership-registry", () => ({
	__esModule: true,
	createProject: (...args: unknown[]) => mockCreateProject(...args),
	countOwnedProjects: (...args: unknown[]) => mockCountOwnedProjects(...args),
}));

// --- Mock @azure/identity: DefaultAzureCredential must be constructible, no key. ---
const defaultAzureCredentialCtor = jest.fn();
jest.mock("@azure/identity", () => ({
	DefaultAzureCredential: jest.fn().mockImplementation(function (this: unknown) {
		defaultAzureCredentialCtor();
	}),
}));

// --- Mock @azure/storage-blob ---
// `create` (not `createIfNotExists`) — a genuine collision must throw so
// createContainerWithSas's retry loop is exercised, not silently swallowed.
const mockCreate = jest.fn().mockResolvedValue({ succeeded: true });
const mockGetContainerClient = jest.fn().mockReturnValue({
	create: mockCreate,
});
const mockGetUserDelegationKey = jest.fn().mockResolvedValue({
	signedObjectId: "obj",
	signedTenantId: "ten",
	signedStartsOn: "2026-06-25T00:00:00Z",
	signedExpiresOn: "2026-06-25T01:00:00Z",
	signedService: "b",
	signedVersion: "2023-11-03",
	value: "FAKE_DELEGATION_KEY",
});

const blobServiceClientCtor = jest.fn();
const fromConnectionString = jest.fn(); // must NEVER be called

const containerSasPermissionsParse = jest.fn((s: string) => ({ _parsed: s }));
const generateBlobSASQueryParameters = jest.fn().mockReturnValue({
	toString: () => "sv=2023-11-03&sr=c&sp=rwlc&sig=FAKE",
});

jest.mock("@azure/storage-blob", () => {
	class BlobServiceClient {
		static fromConnectionString = fromConnectionString;
		constructor(url: string, credential: unknown) {
			blobServiceClientCtor(url, credential);
		}
		getContainerClient = mockGetContainerClient;
		getUserDelegationKey = mockGetUserDelegationKey;
	}
	return {
		BlobServiceClient,
		ContainerClient: class {},
		ContainerSASPermissions: { parse: containerSasPermissionsParse },
		SASProtocol: { Https: "https" },
		generateBlobSASQueryParameters,
	};
});

beforeEach(() => {
	jest.clearAllMocks();
	mockCreate.mockResolvedValue({ succeeded: true });
	mockCountOwnedProjects.mockResolvedValue(0);
	process.env.AZURE_STORAGE_ACCOUNT = "socraticsprojstg";
	jest.spyOn(console, "error").mockImplementation();
});

afterEach(() => {
	delete process.env.AZURE_STORAGE_ACCOUNT;
	jest.restoreAllMocks();
});

/** A NextRequest stand-in carrying a JSON body, which the route reads via req.json(). */
function makeRequest(body: unknown = { projectName: "Acme QoE Review" }): NextRequest {
	return { json: async () => body } as unknown as NextRequest;
}

const CONTAINER_NAME_PATTERN = /^proj-[a-z0-9-]+-\d{14}-[0-9a-f]{6}$/;

describe("POST /api/projects/container", () => {
	it("(a) returns 401 when there is no Auth0 session", async () => {
		mockGetSession.mockResolvedValue(null);
		const { POST } = await import("../route");

		const res = await POST(makeRequest());

		expect(res.status).toBe(401);
		// No Azure work attempted on the unauthenticated path.
		expect(mockGetContainerClient).not.toHaveBeenCalled();
		expect(mockGetUserDelegationKey).not.toHaveBeenCalled();
		// No owner row stamped for an unauthenticated caller.
		expect(mockCreateProject).not.toHaveBeenCalled();
	});

	it("(b) creates the container, mints the SAS, and stamps the ownership row with the typed name", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		const { POST } = await import("../route");

		const res = await POST(makeRequest({ projectName: "Acme QoE Review" }));

		expect(res.status).toBe(201);
		const body = await res.json();

		expect(body.account).toBe("socraticsprojstg");
		expect(body.container).toMatch(CONTAINER_NAME_PATTERN);
		expect(typeof body.sas_url).toBe("string");
		expect(body.sas_url).toContain("socraticsprojstg.blob.core.windows.net");
		expect(body.sas_url).toContain(body.container);
		// The typed name, not the generated container id, is what the card renders.
		expect(body.display_name).toBe("Acme QoE Review");

		// Private container created (`.create()`, no public-access option).
		expect(mockGetContainerClient).toHaveBeenCalledWith(body.container);
		expect(mockCreate).toHaveBeenCalledTimes(1);

		// The keyless signing step ran.
		expect(mockGetUserDelegationKey).toHaveBeenCalledTimes(1);

		// The ownership row was stamped: owner = session.user.sub, the
		// SERVER-minted account/container (not client input), and the typed
		// displayName. This is what every later route authorizes against.
		expect(mockCreateProject).toHaveBeenCalledTimes(1);
		expect(mockCreateProject).toHaveBeenCalledWith({
			owner: "auth0|abc",
			container: body.container,
			account: body.account,
			displayName: "Acme QoE Review",
		});
	});

	it("falls back to \"project\" as the displayName/slug when the name is blank", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		const { POST } = await import("../route");

		const res = await POST(makeRequest({ projectName: "   " }));
		const body = await res.json();

		expect(body.display_name).toBe("project");
		expect(body.container).toMatch(/^proj-project-\d{14}-[0-9a-f]{6}$/);
	});

	it("(c) NEVER takes the account-key path (no fromConnectionString; SAS signed with the delegation key)", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		const { POST } = await import("../route");

		await POST(makeRequest());

		// The account-key constructor is never used.
		expect(fromConnectionString).not.toHaveBeenCalled();

		// BlobServiceClient is built from the account URL + a DefaultAzureCredential token.
		expect(defaultAzureCredentialCtor).toHaveBeenCalled();
		expect(blobServiceClientCtor).toHaveBeenCalledTimes(1);
		const [url, credential] = blobServiceClientCtor.mock.calls[0];
		expect(url).toBe("https://socraticsprojstg.blob.core.windows.net");
		expect(credential).toBeDefined();

		// The SAS is signed with the user-delegation key returned by getUserDelegationKey,
		// not an account-key credential.
		const delegationKey = await mockGetUserDelegationKey.mock.results[0].value;
		const [, signingKey, accountName] = generateBlobSASQueryParameters.mock.calls[0];
		expect(signingKey).toBe(delegationKey);
		expect(accountName).toBe("socraticsprojstg");
	});

	it("(d) requests widened self-service SAS permissions read+write+list+create ('rwlc')", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		const { POST } = await import("../route");

		await POST(makeRequest());

		// SENG-1027 widened the browser SAS from `rl` to `rwlc` so the in-app file
		// browser can upload directly with the handed-out SAS. Still least privilege:
		// no delete ('d') / append ('a').
		expect(containerSasPermissionsParse).toHaveBeenCalledWith("rwlc");
		const [sasOptions] = generateBlobSASQueryParameters.mock.calls[0];
		expect(sasOptions.permissions).toEqual({ _parsed: "rwlc" });
	});

	it("(e) retries with a fresh name on a genuine collision instead of reusing the existing container", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		mockCreate
			.mockRejectedValueOnce(Object.assign(new Error("conflict"), { statusCode: 409, code: "ContainerAlreadyExists" }))
			.mockResolvedValueOnce({ succeeded: true });
		const { POST } = await import("../route");

		const res = await POST(makeRequest());

		expect(res.status).toBe(201);
		expect(mockCreate).toHaveBeenCalledTimes(2);
		// Two distinct candidate names were attempted (retry regenerates the random suffix).
		const [firstName] = mockGetContainerClient.mock.calls[0];
		const [secondName] = mockGetContainerClient.mock.calls[1];
		expect(firstName).not.toBe(secondName);
		expect(secondName).toMatch(CONTAINER_NAME_PATTERN);
	});

	it("gives up after repeated collisions rather than looping forever", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		mockCreate.mockRejectedValue(Object.assign(new Error("conflict"), { statusCode: 409, code: "ContainerAlreadyExists" }));
		const { POST } = await import("../route");

		const res = await POST(makeRequest());

		expect(res.status).toBe(500);
		// Exactly MAX_CREATE_ATTEMPTS (azure-blob-keyless.ts) — bounded, not unbounded.
		expect(mockCreate).toHaveBeenCalledTimes(3);
		expect(mockCreateProject).not.toHaveBeenCalled();
	});

	it("(f) 429s once the caller is at the per-user cap, before any container work happens", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		mockCountOwnedProjects.mockResolvedValue(50); // MAX_PROJECTS_PER_USER default
		const { POST } = await import("../route");

		const res = await POST(makeRequest());

		expect(res.status).toBe(429);
		expect(mockCountOwnedProjects).toHaveBeenCalledWith({ owner: "auth0|abc" });
		// Capped out before any Azure work or ownership stamp is attempted.
		expect(mockGetContainerClient).not.toHaveBeenCalled();
		expect(mockCreate).not.toHaveBeenCalled();
		expect(mockCreateProject).not.toHaveBeenCalled();
	});

	it("(f) does not cap a caller who is under the limit", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		mockCountOwnedProjects.mockResolvedValue(49); // one below the default cap
		const { POST } = await import("../route");

		const res = await POST(makeRequest());

		expect(res.status).toBe(201);
		expect(mockCreate).toHaveBeenCalledTimes(1);
	});
});
