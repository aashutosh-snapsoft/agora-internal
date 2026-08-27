/**
 * Server-route tests for PATCH /api/auth/profile
 *
 * Covers both update paths (tracked transitional state — SENG-870):
 *   • name/title  — BasicInformation.tsx
 *   • image_url   — AvatarProvider / useAvatarManager
 */

import { NextRequest } from "next/server";
import { PATCH } from "../profile/route";

// ── mocks ──────────────────────────────────────────────────────────────────

const mockQuery = jest.fn();

jest.mock("@/server/db/client", () => ({
  getPool: () => ({ query: (...args: unknown[]) => mockQuery(...args) }),
}));

const mockGetUser = jest.fn();

jest.mock("@/lib/identity", () => {
  class IdentityError extends Error {
    status: number;
    constructor(message: string, status = 401) {
      super(message);
      this.status = status;
      Object.setPrototypeOf(this, IdentityError.prototype);
    }
  }
  return {
    getUserFromSessionOrThrow: (...args: unknown[]) => mockGetUser(...args),
    IdentityError,
  };
});

// ── helpers ────────────────────────────────────────────────────────────────

const AUTHED_USER = {
  id: "user-uuid-1",
  external_id: "auth0|abc",
  email: "test@socratics.ai",
  tenant_id: "tenant-uuid-1",
  first_name: "Jane",
  last_name: "Doe",
  image_url: null,
};

function makeRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── tests ──────────────────────────────────────────────────────────────────

describe("PATCH /api/auth/profile", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetUser.mockResolvedValue(AUTHED_USER);
  });

  describe("name/title path (BasicInformation)", () => {
    it("updates first_name and last_name and returns the user id", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: AUTHED_USER.id }] });

      const res = await PATCH(makeRequest({ first_name: "John", last_name: "Smith" }));

      expect(res.status).toBe(200);
      const json = await res.json() as { id: string };
      expect(json.id).toBe(AUTHED_USER.id);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toMatch(/UPDATE users SET/);
      expect(sql).toMatch(/first_name/);
      expect(sql).toMatch(/last_name/);
      expect(params).toContain(AUTHED_USER.id);
      expect(params).toContain(AUTHED_USER.tenant_id);
      expect(params).toContain("John");
      expect(params).toContain("Smith");
    });

    it("updates title independently", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: AUTHED_USER.id }] });

      const res = await PATCH(makeRequest({ title: "Senior Engineer" }));

      expect(res.status).toBe(200);
      const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toMatch(/title/);
      expect(params).toContain("Senior Engineer");
    });
  });

  describe("avatar path (AvatarProvider / useAvatarManager)", () => {
    it("updates image_url and returns the user id", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: AUTHED_USER.id }] });

      const avatarUrl = "https://cdn.example.com/avatar/user-1.jpg";
      const res = await PATCH(makeRequest({ image_url: avatarUrl }));

      expect(res.status).toBe(200);
      const json = await res.json() as { id: string };
      expect(json.id).toBe(AUTHED_USER.id);

      const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toMatch(/image_url/);
      expect(params).toContain(avatarUrl);
    });

    it("accepts null image_url to clear the avatar", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: AUTHED_USER.id }] });

      const res = await PATCH(makeRequest({ image_url: null }));

      expect(res.status).toBe(200);
      const [, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(params).toContain(null);
    });
  });

  describe("allowlist enforcement", () => {
    it("ignores unknown fields and still updates allowed ones", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: AUTHED_USER.id }] });

      const res = await PATCH(
        makeRequest({ first_name: "Jane", external_id: "INJECTED", tenant_id: "INJECTED" })
      );

      expect(res.status).toBe(200);
      const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).not.toMatch(/external_id/);
      expect(params).not.toContain("INJECTED");
    });

    it("returns 400 when body contains only non-allowed fields", async () => {
      const res = await PATCH(makeRequest({ external_id: "hacked", email: "hacked@evil.com" }));

      expect(res.status).toBe(400);
      const json = await res.json() as { error: string };
      expect(json.error).toBe("No fields to update");
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("returns 401 when the session is unauthenticated", async () => {
      const { IdentityError } = jest.requireMock("@/lib/identity") as {
        IdentityError: new (msg: string, status: number) => Error & { status: number };
      };
      mockGetUser.mockRejectedValue(new IdentityError("Unauthorized", 401));

      const res = await PATCH(makeRequest({ first_name: "Jane" }));

      expect(res.status).toBe(401);
    });

    it("returns 404 when the user row is not found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const res = await PATCH(makeRequest({ first_name: "Jane" }));

      expect(res.status).toBe(404);
      const json = await res.json() as { error: string };
      expect(json.error).toBe("User not found");
    });

    it("returns 400 for an empty body", async () => {
      const res = await PATCH(makeRequest({}));

      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid JSON", async () => {
      const req = new NextRequest("http://localhost/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      });

      const res = await PATCH(req);

      expect(res.status).toBe(400);
      const json = await res.json() as { error: string };
      expect(json.error).toBe("Invalid request body");
    });

    it("returns 500 and does not expose internal detail on DB error", async () => {
      mockQuery.mockRejectedValue(new Error("connection refused"));

      const res = await PATCH(makeRequest({ first_name: "Jane" }));

      expect(res.status).toBe(500);
      const json = await res.json() as { error: string };
      expect(json.error).toBe("Internal server error");
    });
  });
});
