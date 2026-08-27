// Identity unit tests — C2 (SENG-778).
// Mocks only auth0.getSession; real identity.ts runs end-to-end.
// Ported from v2-frontend PR #66 and extended for agora specifics.

import { CLAIM_NS } from "@/lib/auth/identity-claims";

const mockGetSession = jest.fn();
jest.mock("@/lib/auth0", () => ({ auth0: { getSession: mockGetSession } }));

import { NextRequest } from "next/server";
import { getUserFromSessionOrThrow, IdentityError } from "../identity";

const UID    = `${CLAIM_NS}/user_id`;
const TID    = `${CLAIM_NS}/tenant_id`;
const LABEL  = `${CLAIM_NS}/tenant_label`;

const SUB        = "auth0|6914d24b22db8a4da024e889";
const USER_UUID  = "e5c31602-bec9-48e0-944d-601cddbbff47";
const TENANT_UUID = "fa209262-548b-45af-a3b6-8e0e9e18fed9";

function fakeReq(): NextRequest {
  return {} as unknown as NextRequest;
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      sub: SUB,
      email: "test@example.com",
      given_name: "Test",
      family_name: "User",
      picture: "https://example.com/pic.jpg",
      [UID]: USER_UUID,
      [TID]: TENANT_UUID,
      [LABEL]: "Acme Corp",
      ...overrides,
    },
  };
}

beforeEach(() => jest.clearAllMocks());

describe("getUserFromSessionOrThrow", () => {
  describe("happy path", () => {
    it("returns correct IdentityUser when all claims are present", async () => {
      mockGetSession.mockResolvedValue(session());
      const user = await getUserFromSessionOrThrow(fakeReq());

      expect(user.id).toBe(USER_UUID);
      expect(user.tenant_id).toBe(TENANT_UUID);
      expect(user.external_id).toBe(SUB);
      expect(user.email).toBe("test@example.com");
      expect(user.first_name).toBe("Test");
      expect(user.last_name).toBe("User");
      expect(user.image_url).toBe("https://example.com/pic.jpg");
    });

    it("populates tenant.display_label from the tenant_label claim", async () => {
      mockGetSession.mockResolvedValue(session());
      const user = await getUserFromSessionOrThrow(fakeReq());

      expect(user.tenant).toEqual({ display_label: "Acme Corp" });
    });

    it("sets tenant.display_label to null when label claim is absent", async () => {
      mockGetSession.mockResolvedValue(session({ [LABEL]: undefined }));
      const user = await getUserFromSessionOrThrow(fakeReq());

      expect(user.tenant).toEqual({ display_label: null });
    });

    it("sets profile fields to null when OIDC fields are absent — no crash", async () => {
      mockGetSession.mockResolvedValue(session({
        given_name: undefined,
        family_name: undefined,
        picture: undefined,
        email: undefined,
      }));
      const user = await getUserFromSessionOrThrow(fakeReq());

      expect(user.first_name).toBeNull();
      expect(user.last_name).toBeNull();
      expect(user.image_url).toBeNull();
      expect(user.email).toBeNull();
    });
  });

  describe("no session / no sub", () => {
    it("throws 401 when session is null", async () => {
      mockGetSession.mockResolvedValue(null);
      await expect(getUserFromSessionOrThrow(fakeReq())).rejects.toMatchObject({
        name: "IdentityError", status: 401,
      });
    });

    it("throws 401 when session has no sub", async () => {
      mockGetSession.mockResolvedValue({ user: { email: "test@example.com" } });
      await expect(getUserFromSessionOrThrow(fakeReq())).rejects.toMatchObject({
        name: "IdentityError", status: 401,
      });
    });
  });

  describe("missing or invalid claims", () => {
    it("throws 401 when user_id claim is absent", async () => {
      mockGetSession.mockResolvedValue(session({ [UID]: undefined }));
      await expect(getUserFromSessionOrThrow(fakeReq())).rejects.toMatchObject({
        name: "IdentityError", status: 401,
        details: expect.stringContaining("Missing identity claims"),
      });
    });

    it("throws 401 when tenant_id claim is absent", async () => {
      mockGetSession.mockResolvedValue(session({ [TID]: undefined }));
      await expect(getUserFromSessionOrThrow(fakeReq())).rejects.toMatchObject({
        name: "IdentityError", status: 401,
      });
    });

    it("throws 401 when user_id is an empty string", async () => {
      mockGetSession.mockResolvedValue(session({ [UID]: "" }));
      await expect(getUserFromSessionOrThrow(fakeReq())).rejects.toMatchObject({
        name: "IdentityError", status: 401,
      });
    });

    it("throws 401 when tenant_id is an empty string", async () => {
      mockGetSession.mockResolvedValue(session({ [TID]: "" }));
      await expect(getUserFromSessionOrThrow(fakeReq())).rejects.toMatchObject({
        name: "IdentityError", status: 401,
      });
    });

    it("throws 401 when user_id is a number (non-string claim)", async () => {
      mockGetSession.mockResolvedValue(session({ [UID]: 42 }));
      await expect(getUserFromSessionOrThrow(fakeReq())).rejects.toMatchObject({
        name: "IdentityError", status: 401,
      });
    });

    it("throws 401 when tenant_id is an object (non-string claim)", async () => {
      mockGetSession.mockResolvedValue(session({ [TID]: { id: "x" } }));
      await expect(getUserFromSessionOrThrow(fakeReq())).rejects.toMatchObject({
        name: "IdentityError", status: 401,
      });
    });
  });
});
