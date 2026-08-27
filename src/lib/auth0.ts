import "server-only";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { applyIdentityClaimsToSession } from "@/lib/auth/identity-claims";

const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
let domain =
	process.env.AUTH0_DOMAIN ?? process.env.NEXT_PUBLIC_AUTH0_DOMAIN ?? "";

if (!domain && issuerBaseUrl) {
	try {
		domain = new URL(issuerBaseUrl).hostname;
	} catch {
		// Leave domain empty; Auth0Client will surface config errors.
	}
}

export const auth0 = new Auth0Client({
	domain: domain || undefined,
	clientId:
		process.env.AUTH0_CLIENT_ID ?? process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
	clientSecret: process.env.AUTH0_CLIENT_SECRET,
	secret: process.env.AUTH0_SECRET,
	appBaseUrl:
		process.env.APP_BASE_URL ??
		process.env.AUTH0_BASE_URL ??
		process.env.NEXT_PUBLIC_URL,
	routes: {
		login: "/api/auth/login",
		logout: "/api/auth/logout",
		callback: "/api/auth/callback",
		backChannelLogout: "/api/auth/backchannel-logout",
		connectAccount: "/api/auth/connect",
	},
	// Allowlist session claims: keep standard OIDC fields + our three identity
	// claims (user_id, tenant_id, tenant_label). Without this hook,
	// @auth0/nextjs-auth0 v4 calls filterDefaultIdTokenClaims and strips all
	// non-standard claims — identity.ts would see undefined for both.
	// Returning the session UNCHANGED instead would persist every ID-token
	// claim into the encrypted cookie (chunking risk, unnecessary exposure).
	//
	// ⚠️  LOAD-BEARING: agora owns the login callback under Pattern A — this is
	// the only beforeSessionSaved that runs. Removing or breaking it means
	// every login across both apps loses claims and gets identityResolved:false.
	// Smoke test on every deploy: log out → log in → /api/auth/me resolves.
	async beforeSessionSaved(session) {
		return {
			...session,
			// applyIdentityClaimsToSession returns Record<string, unknown>; cast back to
			// the SDK's session user type. `sub` is preserved at runtime (it's in
			// DEFAULT_ID_TOKEN_CLAIMS), so this only re-narrows the widened type — without
			// it, `next build`'s typecheck fails ("Property 'sub' is missing in type").
			user: applyIdentityClaimsToSession(
				session.user as Record<string, unknown>,
			) as typeof session.user,
		};
	},
});
