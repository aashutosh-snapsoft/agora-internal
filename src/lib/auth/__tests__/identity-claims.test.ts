import { CLAIM_NS, IDENTITY_CLAIMS, applyIdentityClaimsToSession, hasIdentityClaims } from "../identity-claims";

const UID_CLAIM    = `${CLAIM_NS}/user_id`;
const TENANT_CLAIM = `${CLAIM_NS}/tenant_id`;
const LABEL_CLAIM  = `${CLAIM_NS}/tenant_label`;

describe("CLAIM_NS", () => {
  it("is the canonical namespace string", () => {
    expect(CLAIM_NS).toBe("https://socratics.ai");
  });

  it("all IDENTITY_CLAIMS are under this namespace", () => {
    for (const claim of IDENTITY_CLAIMS) {
      expect(claim.startsWith(CLAIM_NS)).toBe(true);
    }
  });
});

describe("applyIdentityClaimsToSession", () => {
  const base = {
    sub: "auth0|abc",
    email: "test@example.com",
    email_verified: true,
    name: "Test User",
    given_name: "Test",
    family_name: "User",
    picture: "https://example.com/pic.jpg",
  };

  it("keeps standard OIDC claims", () => {
    const result = applyIdentityClaimsToSession({
      ...base,
      [UID_CLAIM]: "user-uuid",
      [TENANT_CLAIM]: "tenant-uuid",
    });
    expect(result.sub).toBe("auth0|abc");
    expect(result.email).toBe("test@example.com");
    expect(result.email_verified).toBe(true);
    expect(result.given_name).toBe("Test");
    expect(result.family_name).toBe("User");
  });

  it("keeps all three identity claims", () => {
    const result = applyIdentityClaimsToSession({
      ...base,
      [UID_CLAIM]:    "user-uuid",
      [TENANT_CLAIM]: "tenant-uuid",
      [LABEL_CLAIM]:  "Acme Corp",
    });
    expect(result[UID_CLAIM]).toBe("user-uuid");
    expect(result[TENANT_CLAIM]).toBe("tenant-uuid");
    expect(result[LABEL_CLAIM]).toBe("Acme Corp");
  });

  it("drops unknown non-standard claims", () => {
    const result = applyIdentityClaimsToSession({
      ...base,
      [UID_CLAIM]: "user-uuid",
      [TENANT_CLAIM]: "tenant-uuid",
      "https://other.com/claim": "should-be-dropped",
      custom_field: "also-dropped",
      iss: "also-dropped",
      aud: "also-dropped",
    });
    expect(result["https://other.com/claim"]).toBeUndefined();
    expect(result["custom_field"]).toBeUndefined();
    expect(result["iss"]).toBeUndefined();
    expect(result["aud"]).toBeUndefined();
  });

  it("handles absent identity claims gracefully (omits them)", () => {
    const result = applyIdentityClaimsToSession({ ...base });
    expect(result[UID_CLAIM]).toBeUndefined();
    expect(result[TENANT_CLAIM]).toBeUndefined();
    expect(result[LABEL_CLAIM]).toBeUndefined();
  });

  it("handles empty object gracefully", () => {
    expect(() => applyIdentityClaimsToSession({})).not.toThrow();
  });
});

describe("hasIdentityClaims", () => {
  it("true when user_id and tenant_id are present, non-empty strings", () => {
    expect(
      hasIdentityClaims({ sub: "auth0|abc", [UID_CLAIM]: "user-uuid", [TENANT_CLAIM]: "tenant-uuid" }),
    ).toBe(true);
  });

  it("false when user_id is missing", () => {
    expect(hasIdentityClaims({ sub: "auth0|abc", [TENANT_CLAIM]: "tenant-uuid" })).toBe(false);
  });

  it("false when tenant_id is missing", () => {
    expect(hasIdentityClaims({ sub: "auth0|abc", [UID_CLAIM]: "user-uuid" })).toBe(false);
  });

  it("false when either claim is empty / whitespace", () => {
    expect(hasIdentityClaims({ [UID_CLAIM]: "   ", [TENANT_CLAIM]: "tenant-uuid" })).toBe(false);
    expect(hasIdentityClaims({ [UID_CLAIM]: "user-uuid", [TENANT_CLAIM]: "" })).toBe(false);
  });

  it("false when a claim is non-string", () => {
    expect(hasIdentityClaims({ [UID_CLAIM]: 123, [TENANT_CLAIM]: "tenant-uuid" })).toBe(false);
  });

  it("false on an empty object", () => {
    expect(hasIdentityClaims({})).toBe(false);
  });
});
