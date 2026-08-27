/**
 * Unit tests for the Stamp Identity Claims Auth0 Action.
 *
 * Uses plain fakes for `event` and `api` — no Auth0 runtime or real DB.
 * The pg client is mocked to control query results. Tests pin the
 * fail-closed contract: every non-success path must call api.access.deny(),
 * never silently mint a claimless session.
 */

const CLAIM_NS = "https://socratics.ai";

// ── pg mock ──────────────────────────────────────────────────────────────────
const mockQuery  = jest.fn();
const mockEnd    = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockResolvedValue(undefined);
const MockClient = jest.fn().mockImplementation(() => ({
  connect: mockConnect,
  query:   mockQuery,
  end:     mockEnd,
}));
// { virtual: true } — pg is not installed in agora (it runs in Auth0's cloud
// runtime, not node_modules). This tells Jest to mock a non-existent module.
jest.mock("pg", () => ({ Client: MockClient }), { virtual: true });

// Load action after mocks are in place.
const action = require("../stamp-identity-claims");

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeEvent(overrides = {}) {
  return {
    user: {
      user_id: "auth0|test123",
      email: "test@example.com",
    },
    secrets: {
      DATABASE_URL: "postgresql://localhost/test",
      DB_CA_CERT: "-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----",
    },
    ...overrides,
  };
}

function makeApi() {
  return {
    idToken:     { setCustomClaim: jest.fn() },
    accessToken: { setCustomClaim: jest.fn() },
    access:      { deny: jest.fn() },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Stamp Identity Claims Action", () => {
  it("stamps all three claims when user is found by sub", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: "user-uuid", tenant_id: "tenant-uuid", tenant_label: "Acme Corp" }],
    });
    const event = makeEvent();
    const api   = makeApi();

    await action.onExecutePostLogin(event, api);

    expect(api.access.deny).not.toHaveBeenCalled();

    // idToken claims
    expect(api.idToken.setCustomClaim).toHaveBeenCalledWith(`${CLAIM_NS}/user_id`,      "user-uuid");
    expect(api.idToken.setCustomClaim).toHaveBeenCalledWith(`${CLAIM_NS}/tenant_id`,    "tenant-uuid");
    expect(api.idToken.setCustomClaim).toHaveBeenCalledWith(`${CLAIM_NS}/tenant_label`, "Acme Corp");

    // accessToken claims mirror idToken
    expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(`${CLAIM_NS}/user_id`,      "user-uuid");
    expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(`${CLAIM_NS}/tenant_id`,    "tenant-uuid");
    expect(api.accessToken.setCustomClaim).toHaveBeenCalledWith(`${CLAIM_NS}/tenant_label`, "Acme Corp");
  });

  it("stamps null tenant_label when tenant has no display_label", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: "user-uuid", tenant_id: "tenant-uuid", tenant_label: null }],
    });
    const api = makeApi();
    await action.onExecutePostLogin(makeEvent(), api);

    expect(api.idToken.setCustomClaim).toHaveBeenCalledWith(`${CLAIM_NS}/tenant_label`, null);
    expect(api.access.deny).not.toHaveBeenCalled();
  });

  it("denies (fail-closed) when sub is not found — no claims set", async () => {
    mockQuery.mockResolvedValue({ rows: [] });
    const api = makeApi();

    await action.onExecutePostLogin(makeEvent(), api);

    expect(api.access.deny).toHaveBeenCalledTimes(1);
    expect(api.idToken.setCustomClaim).not.toHaveBeenCalled();
    expect(api.accessToken.setCustomClaim).not.toHaveBeenCalled();
  });

  it("denies (fail-closed) when user has no tenant_id — no claims set", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: "user-uuid", tenant_id: null, tenant_label: null }],
    });
    const api = makeApi();

    await action.onExecutePostLogin(makeEvent(), api);

    expect(api.access.deny).toHaveBeenCalledTimes(1);
    expect(api.idToken.setCustomClaim).not.toHaveBeenCalled();
  });

  it("denies (fail-closed) on DB error — no claims set, not a silent pass-through", async () => {
    mockQuery.mockRejectedValue(new Error("connection refused"));
    const api = makeApi();

    await action.onExecutePostLogin(makeEvent(), api);

    expect(api.access.deny).toHaveBeenCalledTimes(1);
    expect(api.idToken.setCustomClaim).not.toHaveBeenCalled();
    expect(api.accessToken.setCustomClaim).not.toHaveBeenCalled();
  });

  // Previously: skipped silently when email was absent. Removed — gating on
  // email lets email-less interactive logins bypass every deny path and mint
  // a claimless session. The sub lookup handles unknown subs correctly.
  it("denies (fail-closed) when email is absent — sub lookup still runs, unknown sub denies", async () => {
    mockQuery.mockResolvedValue({ rows: [] }); // sub not found → deny
    const api = makeApi();
    const event = makeEvent({ user: { user_id: "auth0|no-email-user", email: null } });

    await action.onExecutePostLogin(event, api);

    expect(mockQuery).toHaveBeenCalledTimes(1); // lookup ran
    expect(api.access.deny).toHaveBeenCalledTimes(1); // sub not found → denied
    expect(api.idToken.setCustomClaim).not.toHaveBeenCalled();
  });

  it("denies (fail-closed) on duplicate subs — nondeterministic identity must not be stamped", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        { id: "user-uuid-1", tenant_id: "tenant-A", tenant_label: "Tenant A" },
        { id: "user-uuid-2", tenant_id: "tenant-B", tenant_label: "Tenant B" },
      ],
    });
    const api = makeApi();

    await action.onExecutePostLogin(makeEvent(), api);

    expect(api.access.deny).toHaveBeenCalledTimes(1);
    expect(api.idToken.setCustomClaim).not.toHaveBeenCalled();
    expect(api.accessToken.setCustomClaim).not.toHaveBeenCalled();
  });

  it("claim-contract: namespace matches CLAIM_NS in identity-claims.ts", () => {
    // The app reads claims under `${CLAIM_NS}/user_id` from identity-claims.ts.
    // If the Action uses a different string, every login gets identityResolved:false.
    // This test makes a silent mismatch impossible.
    const APP_CLAIM_NS = require("../../../src/lib/auth/identity-claims").CLAIM_NS;
    expect(CLAIM_NS).toBe(APP_CLAIM_NS);
  });

  it("uses sub (user_id) for lookup, not email — email-relink is not ported", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: "user-uuid", tenant_id: "tenant-uuid", tenant_label: "Corp" }],
    });
    const api = makeApi();
    await action.onExecutePostLogin(makeEvent(), api);

    const queryCall = mockQuery.mock.calls[0];
    // The query parameter must be the Auth0 sub, not the email.
    expect(queryCall[1]).toEqual(["auth0|test123"]);
    expect(queryCall[0]).toContain("external_id");
    expect(queryCall[0]).not.toContain("email");
  });

  it("query has no LIMIT clause — duplicate detection requires all matching rows", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: "user-uuid", tenant_id: "tenant-uuid", tenant_label: "Corp" }],
    });
    const api = makeApi();
    await action.onExecutePostLogin(makeEvent(), api);

    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0].toUpperCase()).not.toContain("LIMIT");
  });
});
