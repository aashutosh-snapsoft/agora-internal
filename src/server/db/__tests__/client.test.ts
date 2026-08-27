/**
 * Unit tests for src/server/db/client.ts.
 *
 * buildSslConfig — pure function; exercised with explicit env objects so no
 *   process.env manipulation is needed for SSL branches.
 *
 * getPool — lazy singleton; DATABASE_URL guard throws at first call (not at
 *   module load), so next build succeeds when the var is absent from build-time
 *   env.  Tests use jest.resetModules() + require() to reset the singleton
 *   between cases.
 */

// Mock pg before any require() call — jest.mock is hoisted above imports.
jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
}));

import { buildSslConfig } from "@/server/db/client";

describe("buildSslConfig", () => {
  it("returns a pinned CA object when DATABASE_CA_CERT is set (base64 PEM)", () => {
    const pem = "-----BEGIN CERTIFICATE-----\nfake-cert\n-----END CERTIFICATE-----";
    expect(buildSslConfig({ DATABASE_CA_CERT: Buffer.from(pem).toString("base64") })).toEqual({
      ca: pem,
    });
  });

  it("DATABASE_CA_CERT takes precedence over ALLOW_INSECURE_DB_TLS", () => {
    const pem = "cert-content";
    expect(
      buildSslConfig({
        DATABASE_CA_CERT: Buffer.from(pem).toString("base64"),
        ALLOW_INSECURE_DB_TLS: "true",
        NODE_ENV: "development",
      }),
    ).toEqual({ ca: pem });
  });

  it("returns rejectUnauthorized:false when ALLOW_INSECURE_DB_TLS=true (non-production)", () => {
    expect(
      buildSslConfig({ ALLOW_INSECURE_DB_TLS: "true", NODE_ENV: "development" }),
    ).toEqual({ rejectUnauthorized: false });
  });

  it("ignores ALLOW_INSECURE_DB_TLS=true in production — defense-in-depth guard", () => {
    // Even if the flag is set in a hosted environment's config it must have no effect.
    expect(
      buildSslConfig({ ALLOW_INSECURE_DB_TLS: "true", NODE_ENV: "production" }),
    ).toBe(true);
  });

  it("returns true (system CA) by default — the prod/staging path", () => {
    expect(buildSslConfig({})).toBe(true);
  });
});

describe("getPool", () => {
  const ORIG_ENV = process.env;

  afterEach(() => {
    process.env = ORIG_ENV;
    jest.resetModules();
  });

  it("throws at first call when DATABASE_URL is not set", () => {
    jest.resetModules();
    process.env = { ...ORIG_ENV };
    delete process.env.DATABASE_URL;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPool } = require("@/server/db/client") as typeof import("@/server/db/client");
    expect(() => getPool()).toThrow("DATABASE_URL is not configured");
  });

  it("does NOT throw at module load when DATABASE_URL is absent (next build safety)", () => {
    jest.resetModules();
    process.env = { ...ORIG_ENV };
    delete process.env.DATABASE_URL;
    // require() must succeed — no module-level throw
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/server/db/client");
    }).not.toThrow();
  });

  it("returns the same pool instance on repeated calls (singleton)", () => {
    jest.resetModules();
    process.env = { ...ORIG_ENV, DATABASE_URL: "postgres://localhost/test" };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPool } = require("@/server/db/client") as typeof import("@/server/db/client");
    expect(getPool()).toBe(getPool());
  });
});
