// HASURA_ADMIN_SECRET is intentionally NOT required here.
// C2 (SENG-778): identity.ts no longer queries Hasura at request time —
// user_id and tenant_id are read from Auth0 session claims stamped at login.
// The data layer (HasuraService) still uses HASURA_ADMIN_SECRET but validates
// it independently at the call site.
const required = [
  "AUTH0_ISSUER_BASE_URL",
  "AUTH0_AUDIENCE",
];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
});

export {};
