// Unit tests for the user-delegation SAS minted by src/lib/projects/azure-blob-keyless.ts
// (promoted from src/lib/demo/ — SCS-110/PR #569). These lock the SAS *capability set*:
// the browser-held SAS must carry read+write+list+create so it can list/upload/
// download, and must NOT carry delete ('d') or append ('a') — least privilege.
//
// Unlike azure-blob-keyless.test.ts (which fully mocks @azure/storage-blob), this suite
// exercises the REAL @azure/storage-blob SAS signer against a fake user-delegation key so
// it can assert the real `sp`/`spr`/`skoid`/`sig` query params — a stronger, end-to-end
// check of the browser SAS's widened capability. Kept in its own file because the two
// harnesses (full module mock vs. real SDK) cannot coexist under one jest.mock scope.
//
// `server-only` throws outside a server bundle; under jest it is a no-op. Virtual
// mock keeps this self-contained.
jest.mock("server-only", () => ({}), { virtual: true });

import type { BlobServiceClient, UserDelegationKey } from "@azure/storage-blob";
import { mintUserDelegationSas } from "../azure-blob-keyless";

// A syntactically valid user-delegation key. `value` is any base64 string — the
// signature it produces is irrelevant here; we assert on the `sp` (permissions)
// query param, which is derived from the requested permissions, not the signature.
// NOTE: this @azure/storage-blob build serializes the key's start/expiry via
// `.toISOString()`, so those fields are Date objects at runtime (the public type
// declares them as string — hence the cast).
const FAKE_UDK: UserDelegationKey = {
	signedObjectId: "00000000-0000-0000-0000-000000000001",
	signedTenantId: "00000000-0000-0000-0000-000000000002",
	signedStartsOn: new Date("2026-07-01T00:00:00Z"),
	signedExpiresOn: new Date("2026-07-01T01:00:00Z"),
	signedService: "b",
	signedVersion: "2020-02-10",
	value: Buffer.from("unit-test-delegation-key").toString("base64"),
} as unknown as UserDelegationKey;

function fakeClient(): { client: BlobServiceClient; getUserDelegationKey: jest.Mock } {
	const getUserDelegationKey = jest.fn().mockResolvedValue(FAKE_UDK);
	const client = { getUserDelegationKey } as unknown as BlobServiceClient;
	return { client, getUserDelegationKey };
}

/** Extract the `sp` (signed-permissions) letters from a minted SAS URL. */
function permsOf(sasUrl: string): Set<string> {
	const sp = new URL(sasUrl).searchParams.get("sp") ?? "";
	return new Set(sp.split(""));
}

describe("mintUserDelegationSas — SAS permission set (D1: rwlc, no delete/append)", () => {
	it("mints a SAS whose sp carries read+write+list+create and NOT delete/append", async () => {
		const { client } = fakeClient();

		const sas = await mintUserDelegationSas("demo-abc123-20260701000000", {
			account: "agorademodev",
			client,
		});

		const perms = permsOf(sas.sasUrl);

		// Widened capability: list/upload/download all covered.
		expect(perms.has("r")).toBe(true); // read  → download
		expect(perms.has("w")).toBe(true); // write → upload
		expect(perms.has("l")).toBe(true); // list  → file listing
		expect(perms.has("c")).toBe(true); // create → upload of a new blob

		// Least privilege: destructive / append capabilities MUST be absent.
		expect(perms.has("d")).toBe(false); // NO delete
		expect(perms.has("a")).toBe(false); // NO append

		// Exactly the four widened letters — nothing snuck in.
		expect([...perms].sort().join("")).toBe("clrw");
	});

	it("keeps the keyless posture: signs via getUserDelegationKey + HTTPS-only", async () => {
		const { client, getUserDelegationKey } = fakeClient();

		const sas = await mintUserDelegationSas("demo-abc123-20260701000000", {
			account: "agorademodev",
			client,
		});

		// User-delegation signing key requested (keyless — never the account key).
		expect(getUserDelegationKey).toHaveBeenCalledTimes(1);

		const params = new URL(sas.sasUrl).searchParams;
		expect(params.get("spr")).toBe("https"); // HTTPS-only protocol preserved
		expect(params.get("skoid")).toBe(FAKE_UDK.signedObjectId); // user-delegation SAS (skoid present)
		expect(params.get("sig")).toBeTruthy(); // a signature was produced
	});
});
