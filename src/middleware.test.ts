// The middleware gates `/projects` on an authenticated session that ALSO carries
// stamped identity claims (hasIdentityClaims). A session without claims is a stale
// pre-cutover login that dead-ends the client on the logo screen, so the middleware
// redirects it to re-login (self-heal). `auth0.getSession` is mocked.
const mockGetSession = jest.fn();
const mockCaptureMessage = jest.fn();

jest.mock("@/lib/auth0", () => ({
  auth0: { getSession: (...args: unknown[]) => mockGetSession(...args) },
}));

jest.mock("@sentry/nextjs", () => ({
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
}));

import { NextRequest } from "next/server";
import { CLAIM_NS } from "@/lib/auth/identity-claims";
import { middleware } from "./middleware";

let warnSpy: jest.SpyInstance;

const UID_CLAIM = `${CLAIM_NS}/user_id`;
const TENANT_CLAIM = `${CLAIM_NS}/tenant_id`;

function req(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`);
}

const sessionWithClaims = {
  user: { sub: "auth0|abc", [UID_CLAIM]: "user-uuid", [TENANT_CLAIM]: "tenant-uuid" },
};
const sessionNoClaims = { user: { sub: "auth0|abc" } };

beforeEach(() => {
  jest.clearAllMocks();
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("/projects gate", () => {
  it("passes a session that has identity claims (no warn/alert)", async () => {
    mockGetSession.mockResolvedValue(sessionWithClaims);
    const res = await middleware(req("/projects"));
    expect(res.status).toBe(200);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it("redirects a claims-less session, and warns + alerts (self-heal observability)", async () => {
    mockGetSession.mockResolvedValue(sessionNoClaims);
    const res = await middleware(req("/projects"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/api/auth/login");
    expect(res.headers.get("location")).toContain("returnTo=%2Fprojects");
    // The warn log is the operational signal — assert it can't be silently dropped.
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("identity claims missing"),
      expect.objectContaining({ sub: "auth0|abc" }),
    );
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      "stale-session-no-claims",
      expect.objectContaining({ level: "warning", extra: { sub: "auth0|abc" } }),
    );
  });

  it("redirects when there is no session at all (no warn — nothing to re-stamp)", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await middleware(req("/projects"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/api/auth/login");
    expect(warnSpy).not.toHaveBeenCalled();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it("redirects claims-less requests on /projects sub-paths", async () => {
    mockGetSession.mockResolvedValue(sessionNoClaims);
    const res = await middleware(req("/projects/abc-123"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/api/auth/login");
  });

  it("redirects claims-less requests on deep /projects sub-paths too", async () => {
    mockGetSession.mockResolvedValue(sessionNoClaims);
    const res = await middleware(req("/projects/abc-123/settings"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/api/auth/login");
    expect(res.headers.get("location")).toContain(
      "returnTo=%2Fprojects%2Fabc-123%2Fsettings",
    );
  });
});

describe("public routes", () => {
  it("does not gate /welcome (no session lookup)", async () => {
    const res = await middleware(req("/welcome"));
    expect(res.status).toBe(200);
    expect(mockGetSession).not.toHaveBeenCalled();
  });
});
