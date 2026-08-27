import { Pool } from "pg";

type SslEnv = {
  DATABASE_CA_CERT?: string;
  ALLOW_INSECURE_DB_TLS?: string;
  NODE_ENV?: string;
};

/**
 * Exported for unit testing. Pass an explicit env object to exercise individual
 * branches without manipulating process.env.
 *
 * Priority:
 *   1. DATABASE_CA_CERT set → verify against pinned CA (base64 PEM)
 *   2. ALLOW_INSECURE_DB_TLS=true AND NODE_ENV !== "production" → skip verification
 *   3. Default → ssl: true (system CA bundle — correct for prod/staging on Azure)
 *
 * Note: ssl: true trusts the system CA and does NOT require DATABASE_CA_CERT;
 * it simply uses the runtime's system roots. Set DATABASE_CA_CERT only when
 * you need cert pinning beyond what the system CA provides.
 */
export function buildSslConfig(
  env: SslEnv,
): boolean | { rejectUnauthorized: false } | { ca: string } {
  if (env.DATABASE_CA_CERT) {
    // Prod / staging: verify the server against the pinned CA cert (base64 PEM).
    return { ca: Buffer.from(env.DATABASE_CA_CERT, "base64").toString("utf8") };
  }
  if (env.ALLOW_INSECURE_DB_TLS === "true" && env.NODE_ENV !== "production") {
    // Local dev only — set ALLOW_INSECURE_DB_TLS=true in .env.local.
    // The NODE_ENV guard is defense-in-depth: if this flag ever leaks into a
    // hosted environment's config, verification is NOT disabled in production.
    return { rejectUnauthorized: false };
  }
  // Trust the system CA bundle (Azure Database for PostgreSQL certificates are
  // covered by the runtime's system roots in all hosted environments).
  return true;
}

let _pool: Pool | undefined;

/**
 * Returns the shared connection pool, creating it on first call (lazy singleton).
 *
 * Throwing here — at first request — rather than at module load keeps next build
 * working when DATABASE_URL is absent from build-time env (the Docker build does
 * not inject runtime secrets). The error still surfaces fast (first HTTP request
 * that touches the DB) with a clear message rather than an opaque libpq default.
 *
 * Tests should mock this export, not getPool's internals.
 */
export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("[db] DATABASE_URL is not configured");
  }
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: buildSslConfig(process.env as SslEnv),
      max: 5,
      connectionTimeoutMillis: 5000,
      statement_timeout: 4000,
    });
    // Prevent unhandled-event crash when an idle connection is killed server-side
    // (DB failover, idle timeout, network blip). Without this listener, Node treats
    // the 'error' event as an uncaught exception and crashes the process.
    _pool.on("error", (err) => {
      console.error("[db pool] idle client error:", err.message);
    });
  }
  return _pool;
}
