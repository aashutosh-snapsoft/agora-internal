// /api/auth/me route tests — mocks auth0.getSession only; real identity.ts runs.
// Covers the three paths every stale session + every fresh session will hit.

import { CLAIM_NS } from "@/lib/auth/identity-claims";

const mockGetSession = jest.fn();
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: mockGetSession } }));

import { NextRequest } from "next/server";
import { GET } from "../route";

const UID    = `${CLAIM_NS}/user_id`;
const TID    = `${CLAIM_NS}/tenant_id`;
const LABEL  = `${CLAIM_NS}/tenant_label`;

const SUB         = "auth0|test123";
const USER_UUID   = "e5c31602-bec9-48e0-944d-601cddbbff47";
const TENANT_UUID = "fa209262-548b-45af-a3b6-8e0e9e18fed9";

function req(): NextRequest {
  return new NextRequest("http://localhost/api/auth/me");
}

function fullSession() {
  return {
    user: {
      sub: SUB,
      email: "test@example.com",
      given_name: "Test",
      family_name: "User",
      [UID]:   USER_UUID,
      [TID]:   TENANT_UUID,
      [LABEL]: "Acme Corp",
    },
  };
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/auth/me", () => {
  it("returns 200 identityResolved:true with correct user shape when claims are present", async () => {
    mockGetSession.mockResolvedValue(fullSession());
    const res  = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.authenticated).toBe(true);
    expect(body.identityResolved).toBe(true);
    expect(body.user.id).toBe(USER_UUID);
    expect(body.user.tenant_id).toBe(TENANT_UUID);
    expect(body.user.external_id).toBe(SUB);
    expect(body.tenant_id).toBe(TENANT_UUID);
  });

  it("returns 200 identityResolved:false with errorPayload when session exists but claims are missing", async () => {
    // A stale session — user is authenticated but claims were not stamped.
    mockGetSession.mockResolvedValue({ user: { sub: SUB, email: "test@example.com" } });
    const res  = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.authenticated).toBe(true);
    expect(body.identityResolved).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.status).toBe(401);
  });

  it("returns 401 with Cache-Control and Clear-Site-Data headers when there is no session", async () => {
    mockGetSession.mockResolvedValue(null);
    const res  = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.authenticated).toBe(false);
    expect(body.identityResolved).toBe(false);
    expect(res.headers.get("Cache-Control")).toBeTruthy();
    expect(res.headers.get("Clear-Site-Data")).toBeTruthy();
  });
});
