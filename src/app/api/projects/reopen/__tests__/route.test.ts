/**
 * Tests for POST /api/projects/reopen — re-mints a fresh SAS for an OWNED,
 * already-persisted project container.
 *
 * Added per the PR #569 re-review (commit b0eba41): this is the one new route
 * in that commit that hands out a live SAS with zero prior coverage, and the
 * ownership gate on it is the exact backstop that matters if a container id
 * ever leaks (e.g. via logs, a shared link, or a guessed name). Adapted from
 * the sibling container/__tests__/route.test.ts rather than written from
 * scratch, per the reviewer's own suggestion.
 *
 * Asserts the load-bearing security properties:
 *   (a) 401 without an Auth0 session — no ownership lookup, no SAS minted.
 *   (b) 403 when the caller does not own the container (getOwnedProject
 *       returns null for their (sub, container) pair) — the actual
 *       authorization boundary; NO SAS is minted for an unowned container.
 *   (c) 200 mints a fresh SAS for the ROW'S server-stored (account, container),
 *       never raw client input — the request body is only ever used as a
 *       lookup KEY into the ownership registry, not as data trusted directly.
 *   (d) Accepts the `{ id }` alias for `{ container }` in the request body.
 *   (e) Never takes the account-key path (no fromConnectionString) — the
 *       re-mint reuses the same keyless mintUserDelegationSas core as
 *       /api/projects/container.
 *
 * The Azure SDK is fully mocked — no network, no real credential resolution.
 */

// Real top-level import (not just the inline `import("next/server").NextRequest`
// type reference) — makes this file an ES module in TS's eyes, so its
// top-level consts/functions (mockGetSession, makeRequest, ...) get their own
// module scope instead of colliding with same-named globals in sibling script-
// mode test files (see container/__tests__/route.test.ts for the same fix).
import type { NextRequest } from "next/server";

// `server-only` is a build-time marker with no runtime behavior; in the jest
// node env it has no module to resolve, so map it to an empty module.
jest.mock("server-only", () => ({}), { virtual: true });

// --- Mock auth0 (house pattern: auth0.getSession) ---
const mockGetSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
	auth0: { getSession: (...args: unknown[]) => mockGetSession(...args) },
}));

// --- Mock the ownership registry: /reopen's ONLY authorization boundary. ---
const mockGetOwnedProject = jest.fn();
jest.mock("@/lib/projects/ownership-registry", () => ({
	__esModule: true,
	getOwnedProject: (...args: unknown[]) => mockGetOwnedProject(...args),
}));

// --- Mock @azure/identity: DefaultAzureCredential must be constructible, no key. ---
const defaultAzureCredentialCtor = jest.fn();
jest.mock("@azure/identity", () => ({
	DefaultAzureCredential: jest.fn().mockImplementation(function (this: unknown) {
		defaultAzureCredentialCtor();
	}),
}));

// --- Mock @azure/storage-blob ---
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
	mockGetUserDelegationKey.mockResolvedValue({
		signedObjectId: "obj",
		signedTenantId: "ten",
		signedStartsOn: "2026-06-25T00:00:00Z",
		signedExpiresOn: "2026-06-25T01:00:00Z",
		signedService: "b",
		signedVersion: "2023-11-03",
		value: "FAKE_DELEGATION_KEY",
	});
	process.env.AZURE_STORAGE_ACCOUNT = "socraticsprojstg";
	jest.spyOn(console, "error").mockImplementation();
});

afterEach(() => {
	delete process.env.AZURE_STORAGE_ACCOUNT;
	jest.restoreAllMocks();
});

/** The row getOwnedProject returns for a hit — the SERVER's stored record. */
const OWNED_PROJECT = {
	partitionKey: "auth0|abc",
	rowKey: "proj-acme-20260810120000-ab12cd",
	account: "socraticsprojstg",
	container: "proj-acme-20260810120000-ab12cd",
	displayName: "Acme QoE Review",
	createdAt: "2026-08-10T12:00:00.000Z",
	status: "active" as const,
};

/** A NextRequest stand-in carrying a JSON body, which the route reads via req.json(). */
function makeRequest(body: unknown = { container: OWNED_PROJECT.container }): NextRequest {
	return { json: async () => body } as unknown as NextRequest;
}

describe("POST /api/projects/reopen", () => {
	it("(a) returns 401 when there is no Auth0 session", async () => {
		mockGetSession.mockResolvedValue(null);
		const { POST } = await import("../route");

		const res = await POST(makeRequest());

		expect(res.status).toBe(401);
		// No ownership lookup, no Azure work, for an unauthenticated caller.
		expect(mockGetOwnedProject).not.toHaveBeenCalled();
		expect(mockGetUserDelegationKey).not.toHaveBeenCalled();
	});

	it("(b) returns 403 when the caller does not own the container — no SAS is minted", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|attacker" } });
		mockGetOwnedProject.mockResolvedValue(null); // not found in the caller's partition
		const { POST } = await import("../route");

		const res = await POST(makeRequest({ container: OWNED_PROJECT.container }));

		expect(res.status).toBe(403);
		// The ownership check ran with the CALLER's own sub as the partition key —
		// never anything else — and the caller's guessed/leaked container id.
		expect(mockGetOwnedProject).toHaveBeenCalledWith({
			owner: "auth0|attacker",
			container: OWNED_PROJECT.container,
		});
		// Denied before any SAS work is attempted.
		expect(mockGetUserDelegationKey).not.toHaveBeenCalled();
	});

	it("(c) mints a fresh SAS for the row's server-stored account/container, not raw client input", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		mockGetOwnedProject.mockResolvedValue(OWNED_PROJECT);
		const { POST } = await import("../route");

		// Client input includes an account field the route must NOT trust —
		// only the ownership row's stored account/container are ever used.
		const res = await POST(
			makeRequest({ container: OWNED_PROJECT.container, account: "attacker-controlled-account" }),
		);

		expect(res.status).toBe(200);
		const body = await res.json();

		expect(body.account).toBe(OWNED_PROJECT.account);
		expect(body.container).toBe(OWNED_PROJECT.container);
		expect(typeof body.sas_url).toBe("string");
		expect(body.sas_url).toContain(`${OWNED_PROJECT.account}.blob.core.windows.net`);
		expect(body.sas_url).toContain(OWNED_PROJECT.container);
		expect(body.display_name).toBe(OWNED_PROJECT.displayName);

		// The SAS was minted against the account the BlobServiceClient was
		// constructed with — the row's stored account, not client input.
		expect(blobServiceClientCtor).toHaveBeenCalledTimes(1);
		const [url] = blobServiceClientCtor.mock.calls[0];
		expect(url).toBe(`https://${OWNED_PROJECT.account}.blob.core.windows.net`);
	});

	it("(d) accepts the `id` alias for `container` in the request body", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		mockGetOwnedProject.mockResolvedValue(OWNED_PROJECT);
		const { POST } = await import("../route");

		const res = await POST(makeRequest({ id: OWNED_PROJECT.container }));

		expect(res.status).toBe(200);
		expect(mockGetOwnedProject).toHaveBeenCalledWith({
			owner: "auth0|abc",
			container: OWNED_PROJECT.container,
		});
	});

	it("returns 400 when neither container nor id is present in the body", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		const { POST } = await import("../route");

		const res = await POST(makeRequest({}));

		expect(res.status).toBe(400);
		expect(mockGetOwnedProject).not.toHaveBeenCalled();
	});

	it("(e) NEVER takes the account-key path (no fromConnectionString; SAS signed with the delegation key)", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		mockGetOwnedProject.mockResolvedValue(OWNED_PROJECT);
		const { POST } = await import("../route");

		await POST(makeRequest());

		expect(fromConnectionString).not.toHaveBeenCalled();
		expect(defaultAzureCredentialCtor).toHaveBeenCalled();

		const delegationKey = await mockGetUserDelegationKey.mock.results[0].value;
		const [, signingKey, accountName] = generateBlobSASQueryParameters.mock.calls[0];
		expect(signingKey).toBe(delegationKey);
		expect(accountName).toBe(OWNED_PROJECT.account);
	});

	it("returns 500 and does not leak the underlying error when the re-mint fails", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		mockGetOwnedProject.mockResolvedValue(OWNED_PROJECT);
		mockGetUserDelegationKey.mockRejectedValue(new Error("Delegator role missing on identity"));
		const { POST } = await import("../route");

		const res = await POST(makeRequest());

		expect(res.status).toBe(500);
		const body = await res.json();
		expect(JSON.stringify(body)).not.toContain("Delegator role missing on identity");
	});
});
