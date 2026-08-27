import { NextResponse } from "next/server";
import { NO_CACHE_HEADERS, CLEAR_SITE_DATA_HEADERS } from "@/lib/cache-control";

// This route is a stateless escape hatch that clears browser storage/caches
// before the main app initializes, ensuring stale client state can never trap users.

const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;

const buildRedirectScript = (hasAuth0: boolean) => {
	if (hasAuth0) {
		return `
  const logoutUrl =
    "https://${auth0Domain}/v2/logout" +
    "?client_id=${clientId}" +
    "&returnTo=" + encodeURIComponent(returnTo) +
    (forceSSO ? "&federated" : "");
  window.location.replace(logoutUrl);`;
	}
	return `
  window.location.replace(returnTo);`;
};

const buildResetHtml = (hasAuth0: boolean) => {
	const redirectScript = buildRedirectScript(hasAuth0);
	const script = `
(async () => {
  const safe = async (fn) => { try { await fn(); } catch {} };
  // IMPORTANT: /reset must never reintroduce persisted state after clearing.
  const params = new URLSearchParams(window.location.search);
  const forceSSO = params.get("forceSSO") === "1";
  await safe(() => localStorage.clear());
  await safe(() => sessionStorage.clear());

  await safe(async () => {
    if (!("caches" in window)) return;
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  });

  await safe(async () => {
    if (!("serviceWorker" in navigator)) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  });

  // NOTE:
  // /reset is a system recovery mechanism, not a user logout.
  // Auth0 /oidc/logout shows a confirmation UI that cannot be disabled in this tenant.
  // /v2/logout is the correct endpoint for silent, forced logout.
  const returnTo = window.location.origin + "/welcome";
${redirectScript}
})();
`;

	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="cache-control" content="no-store, no-cache, must-revalidate" />
    <meta http-equiv="pragma" content="no-cache" />
    <meta http-equiv="expires" content="0" />
    <title>Resetting...</title>
  </head>
  <body>
    <noscript>This page resets browser state and requires JavaScript.</noscript>
    <p>Resetting browser state...</p>
    <script>${script}</script>
  </body>
</html>`;
};

export const runtime = "nodejs";

export async function GET() {
	const hasAuth0 = Boolean(auth0Domain && clientId);
	const html = buildResetHtml(hasAuth0);
	const res = new NextResponse(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			...NO_CACHE_HEADERS,
			...CLEAR_SITE_DATA_HEADERS,
		},
	});
	return res;
}
