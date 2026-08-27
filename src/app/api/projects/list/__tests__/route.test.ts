/**
 * Tests for GET /api/projects/list (PR #569 review, blocking item 3 — the
 * container route's suite was ported; this small suite is new for /list).
 */

// Real top-level import (not just the inline `import("next/server").NextRequest`
// type references below) — makes this file an ES module in TS's eyes, so its
// top-level consts/functions (mockGetSession, makeRequest, ...) get their own
// module scope instead of colliding with same-named globals in sibling script-
// mode test files (this is what "Cannot redeclare block-scoped variable" was).
import type { NextRequest } from "next/server";

jest.mock("server-only", () => ({}), { virtual: true });

const mockGetSession = jest.fn();
jest.mock("@/lib/auth0", () => ({
	auth0: { getSession: (...args: unknown[]) => mockGetSession(...args) },
}));

const mockListOwnedProjects = jest.fn();
jest.mock("@/lib/projects/ownership-registry", () => ({
	__esModule: true,
	listOwnedProjects: (...args: unknown[]) => mockListOwnedProjects(...args),
}));

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(console, "error").mockImplementation();
});

afterEach(() => {
	jest.restoreAllMocks();
});

function makeRequest(): NextRequest {
	return {} as NextRequest;
}

describe("GET /api/projects/list", () => {
	it("returns 401 when there is no Auth0 session, without querying the registry", async () => {
		mockGetSession.mockResolvedValue(null);
		const { GET } = await import("../route");

		const res = await GET(makeRequest());

		expect(res.status).toBe(401);
		expect(mockListOwnedProjects).not.toHaveBeenCalled();
	});

	it("lists only the caller's own projects, scoped by their session sub", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		const projects = [
			{ container: "proj-acme-20260810-abc123", account: "stg", displayName: "Acme QoE Review", createdAt: "2026-08-10T00:00:00Z", status: "active" },
		];
		mockListOwnedProjects.mockResolvedValue(projects);
		const { GET } = await import("../route");

		const res = await GET(makeRequest());

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.projects).toEqual(projects);
		// The owner-scoping is structural — asserting the call was made with the
		// caller's OWN sub, never anything client-supplied (there is no client
		// input on this route at all).
		expect(mockListOwnedProjects).toHaveBeenCalledWith({ owner: "auth0|abc" });
	});

	it("returns 500 and does not leak the underlying error when the registry query fails", async () => {
		mockGetSession.mockResolvedValue({ user: { sub: "auth0|abc" } });
		mockListOwnedProjects.mockRejectedValue(new Error("Tables endpoint unreachable"));
		const { GET } = await import("../route");

		const res = await GET(makeRequest());

		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.error).toBe("Failed to list projects");
		expect(JSON.stringify(body)).not.toContain("Tables endpoint unreachable");
	});
});
