/**
 * Shared identity claim constants and session helpers for C2.
 *
 * CLAIM_NS is the single source of truth for the claim namespace. Both this
 * file and auth0/actions/stamp-identity-claims.js use the same string; a
 * mismatch between the Action and the app is the exact failure mode that
 * caused silent drift in PR #436, so this string must be imported here
 * rather than re-typed in each consumer.
 *
 * beforeSessionSaved is the load-bearing hook that keeps our claims in the
 * session cookie. @auth0/nextjs-auth0 v4 strips non-standard ID token claims
 * via filterDefaultIdTokenClaims unless this hook is provided. We allowlist
 * only the default OIDC claims + our two identity claims rather than returning
 * the session unchanged — the latter would persist every ID-token claim into
 * the encrypted cookie (chunking risk, unnecessary exposure).
 *
 * ⚠️  This hook is the ONLY one that runs for Pattern A — agora owns the
 * login callback, so removing or breaking it breaks every login across both
 * apps (agora + v2-frontend). Any change here needs a staging smoke test:
 * log out → log in → identity resolves with both claims.
 */

export const CLAIM_NS = "https://socratics.ai";

/** Standard OIDC claims the SDK preserves by default. */
const DEFAULT_ID_TOKEN_CLAIMS = [
  "sub",
  "name",
  "nickname",
  "given_name",
  "family_name",
  "picture",
  "email",
  "email_verified",
  "org_id",
] as const;

/** Claims our Auth0 Action stamps. */
export const IDENTITY_CLAIMS = [
  `${CLAIM_NS}/user_id`,
  `${CLAIM_NS}/tenant_id`,
  `${CLAIM_NS}/tenant_label`,
] as const;

/**
 * Allowlist the session user to exactly the standard OIDC claims + our three
 * identity claims. Used as the `beforeSessionSaved` hook in Auth0Client.
 *
 * Exported for unit testing — call this function in tests rather than
 * constructing a full Auth0Client.
 */
export function applyIdentityClaimsToSession(
  rawUser: Record<string, unknown>,
): Record<string, unknown> {
  const user: Record<string, unknown> = {};

  for (const key of DEFAULT_ID_TOKEN_CLAIMS) {
    if (key in rawUser) user[key] = rawUser[key];
  }

  for (const claim of IDENTITY_CLAIMS) {
    if (claim in rawUser) user[claim] = rawUser[claim];
  }

  return user;
}

/**
 * True iff the session user carries the stamped identity claims the app needs to
 * resolve identity (`user_id` + `tenant_id`, non-empty strings). Mirrors
 * v2-frontend's `hasIdentityClaims`. The middleware uses this to redirect a
 * claims-less session (stale pre-cutover login, or a broken Action) to re-login
 * instead of letting it dead-end on the client's logo screen.
 */
export function hasIdentityClaims(user: Record<string, unknown>): boolean {
  // Checks the two claims identity resolution requires. If a *required* claim is
  // ever added to IDENTITY_CLAIMS, extend this guard to match (it intentionally
  // does not gate on tenant_label, which is optional).
  const uid = user[`${CLAIM_NS}/user_id`];
  const tid = user[`${CLAIM_NS}/tenant_id`];
  return (
    typeof uid === "string" &&
    uid.trim() !== "" &&
    typeof tid === "string" &&
    tid.trim() !== ""
  );
}
