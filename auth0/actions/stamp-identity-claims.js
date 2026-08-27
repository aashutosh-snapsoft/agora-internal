/**
 * Auth0 Post-Login Action: Stamp Identity Claims (SENG-776)
 *
 * Stamps user_id, tenant_id, and tenant_label as custom claims on the ID token
 * and access token at login time. This is the source of truth for identity in
 * both agora and v2-frontend — no per-request DB lookup is needed.
 *
 * Claim namespace (must match CLAIM_NS in src/lib/auth/identity-claims.ts):
 *   https://socratics.ai/user_id
 *   https://socratics.ai/tenant_id
 *   https://socratics.ai/tenant_label
 *
 * Fail-closed: every non-happy-path calls api.access.deny() so Auth0 never
 * mints a session without claims. A claimless session is an unrecoverable
 * dead end (identityResolved: false for its entire lifetime); denying is
 * preferable to silently minting a broken session.
 *
 * Lookup strategy: sub-only (external_id = event.user.user_id). Email is not
 * used — the lookup doesn't need it, and gating on email presence would let
 * email-less logins (passwordless, enterprise connections missing the email
 * scope) skip every deny path and mint exactly the claimless session we're
 * trying to prevent. If a sub is unknown, the deny path already handles it.
 *
 * Duplicate-sub guard: if more than one row matches the sub, we deny loudly
 * rather than silently stamping a nondeterministic identity. The UNIQUE
 * constraint on external_id (part of the pre-deploy reconciliation plan in
 * PR #529) makes this unreachable in steady state; the guard is defense in
 * depth until it lands.
 *
 * Stale external_ids must be reconciled before deploying — see PR #529
 * description for the one-time migration plan.
 *
 * Secrets required (set in Auth0 Action Secrets):
 *   DATABASE_URL  — Postgres connection string (least-privilege read role)
 *   DB_CA_CERT    — PEM-encoded CA certificate for the Postgres server
 *                   (required for TLS certificate validation)
 *
 * Deploy order: SENG-776 Action → PR #529 (agora) → re-login (one-time,
 * internal-only) → PR #66 (v2-frontend). Sessions saved before this deploys
 * have no claims and will return identityResolved: false until re-login.
 */

const { Client } = require("pg");

/** Claim namespace — must stay in sync with CLAIM_NS in identity-claims.ts. */
const CLAIM_NS = "https://socratics.ai";

exports.onExecutePostLogin = async (event, api) => {
  // No email gate: M2M flows never trigger onExecutePostLogin, and gating on
  // email presence would let email-less interactive logins skip every deny
  // path and mint a claimless session. The sub lookup handles unknown subs.

  const client = new Client({
    connectionString: event.secrets.DATABASE_URL,
    ssl: {
      // Use the provider CA certificate — rejectUnauthorized: false would
      // accept any certificate over a public-internet connection that carries
      // the tenant-isolation source of truth.
      ca: event.secrets.DB_CA_CERT,
    },
    connectionTimeoutMillis: 5000,
    statement_timeout: 4000,
  });

  try {
    await client.connect();

    // Lookup by Auth0 sub (external_id) only — not email.
    // No LIMIT: if duplicate rows exist for this sub, deny rather than stamp
    // a nondeterministic identity. Defense in depth until the UNIQUE constraint
    // on external_id (pre-deploy reconciliation plan) is in place.
    const result = await client.query(
      `SELECT u.id, u.tenant_id, t.display_label AS tenant_label
       FROM users u
       LEFT JOIN tenants t ON t.id = u.tenant_id
       WHERE u.external_id = $1`,
      [event.user.user_id],
    );

    if (result.rows.length === 0) {
      console.log(
        `[stamp-identity] sub not found: ${event.user.user_id} — denying`,
      );
      api.access.deny(
        "Your account could not be found. Please contact support.",
      );
      return;
    }

    if (result.rows.length > 1) {
      // Duplicate sub — ambiguous identity. Deny loudly rather than stamp a
      // nondeterministic row. This is a data-integrity alert: the pre-deploy
      // reconciliation and UNIQUE constraint should make this unreachable.
      console.error(
        `[stamp-identity] duplicate rows for sub ${event.user.user_id} (count=${result.rows.length}) — denying`,
      );
      api.access.deny(
        "Your account has a data conflict. Please contact support.",
      );
      return;
    }

    const user = result.rows[0];

    if (!user.tenant_id) {
      console.log(
        `[stamp-identity] user ${user.id} has no tenant_id — denying`,
      );
      api.access.deny(
        "Your account is not assigned to a tenant. Please contact support.",
      );
      return;
    }

    api.idToken.setCustomClaim(`${CLAIM_NS}/user_id`, user.id);
    api.idToken.setCustomClaim(`${CLAIM_NS}/tenant_id`, user.tenant_id);
    api.idToken.setCustomClaim(`${CLAIM_NS}/tenant_label`, user.tenant_label ?? null);

    api.accessToken.setCustomClaim(`${CLAIM_NS}/user_id`, user.id);
    api.accessToken.setCustomClaim(`${CLAIM_NS}/tenant_id`, user.tenant_id);
    api.accessToken.setCustomClaim(`${CLAIM_NS}/tenant_label`, user.tenant_label ?? null);

    console.log(
      `[stamp-identity] stamped user_id=${user.id} tenant_id=${user.tenant_id}`,
    );
  } catch (err) {
    // DB error → deny, not silent pass-through. A claimless session is worse
    // than a denied login: the user gets identityResolved: false for the whole
    // session lifetime with no path to recovery until manual re-login.
    console.error("[stamp-identity] DB error:", err.message);
    api.access.deny(
      "Identity verification failed. Please try again in a moment.",
    );
  } finally {
    await client.end().catch(() => {});
  }
};
