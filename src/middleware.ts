import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { hasIdentityClaims } from "@/lib/auth/identity-claims";
import { NO_CACHE_HEADERS } from "@/lib/cache-control";
import * as Sentry from "@sentry/nextjs";

export async function middleware(req: NextRequest) {
	const pathname = req.nextUrl.pathname;
	const publicRoutes = ["/welcome", "/verify-email", "/login-error"];
	const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

	const applyNoCacheHeaders = (res: NextResponse) => {
		for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
			res.headers.set(key, value);
		}
		return res;
	};


	// Auth: Require login for /projects routes (check first for fast rejection).
	// A session must ALSO carry stamped identity claims — a claims-less session is
	// a stale pre-cutover login (or a broken Action/beforeSessionSaved hook). It
	// would pass a session-only gate but then dead-end the client on the logo
	// screen (/api/auth/me returns identityResolved:false). Redirecting it to
	// re-login re-stamps the claims, so the failure self-heals.
	//
	// NOTE (PR #569 review): this matches the /projects PAGE only —
	// pathname.startsWith("/projects") does not match /api/projects/*, whose
	// routes check session.user.sub only (no identity-claims requirement).
	// Authorization still holds either way: ownership-registry partitions by
	// sub, so a claims-less session can't reach another user's data — it just
	// means an API call could theoretically proceed with a stale pre-cutover
	// session where the page itself would have redirected to re-login first.
	// Deliberate asymmetry, not a gap to "fix" by adding the claims check here
	// without checking whether that's actually wanted on the API surface too.
	if (pathname.startsWith("/projects")) {
		const session = await auth0.getSession(req);
		if (!session?.user || !hasIdentityClaims(session.user)) {
			if (session?.user) {
				// Valid session, no stamped claims — expected during cutover as old
				// sessions drain. A post-cutover spike here means the Auth0 Action or
				// agora's beforeSessionSaved hook broke, so alert (not just log).
				console.warn(
					"[middleware] session present but identity claims missing — redirecting to re-login",
					{ sub: session.user.sub },
				);
				Sentry.captureMessage("stale-session-no-claims", {
					level: "warning",
					extra: { sub: session.user.sub },
				});
			}
			const returnTo = pathname + req.nextUrl.search;
			const loginUrl = new URL("/api/auth/login", req.url);
			loginUrl.searchParams.set("returnTo", returnTo);
			const res = NextResponse.redirect(loginUrl);
			applyNoCacheHeaders(res);
			return res;
		}
	}

	// Security: Check for suspicious POST requests (server action exploits)
	if (req.method === "POST") {
		const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-client-ip") || "unknown";
		const userAgent = req.headers.get("user-agent") || "unknown";
		const contentType = req.headers.get("content-type") || "none";
		const nextAction = req.headers.get("next-action");
		const contentLength = req.headers.get("content-length") || "0";

		// Capture all headers for debugging
		const headers: Record<string, string> = {};
		req.headers.forEach((value, key) => {
			headers[key] = value;
		});

		// Try to capture body for non-API routes (where we don't expect legitimate POSTs with bodies)
		let bodyPreview = "";
		if (!pathname.startsWith("/api/")) {
			try {
				const clonedReq = req.clone();
				const body = await clonedReq.text();
				bodyPreview = body.substring(0, 500); // First 500 chars
			} catch {
				bodyPreview = "[Could not read body]";
			}
		}

		// Check for suspicious server action requests
		// Next.js server actions have a Next-Action header with a hash
		const isServerActionRequest = nextAction !== null;
		const isApiRoute = pathname.startsWith("/api/");

		// Log detailed info for suspicious requests (non-API POST or server action attempts)
		if (!isApiRoute || isServerActionRequest) {
			console.log("[Middleware] Suspicious POST request", {
				pathname,
				ip,
				userAgent,
				contentType,
				contentLength,
				nextAction: nextAction ? nextAction.substring(0, 50) : null,
				isServerActionRequest,
				bodyPreview: bodyPreview || "[API route - not captured]",
				headers,
				timestamp: new Date().toISOString(),
			});
		}

		// Block requests that look like server action attacks
		// We don't use server actions, so any Next-Action header is suspicious
		if (isServerActionRequest && !isApiRoute) {
			console.log("[Middleware] Blocked server action request", {
				pathname,
				ip,
				nextAction: nextAction?.substring(0, 50),
			});
			Sentry.captureMessage("Blocked server action attack attempt", {
				level: "warning",
				extra: {
					pathname,
					ip,
					nextAction: nextAction?.substring(0, 50),
					userAgent: req.headers.get("user-agent"),
				},
			});
			return applyNoCacheHeaders(
				new NextResponse(JSON.stringify({ error: "Invalid request" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
				})
			);
		}

		// Block POST to static file paths
		if (
			pathname.startsWith("/_next/static/") ||
			pathname.endsWith(".js") ||
			pathname.endsWith(".css") ||
			pathname.endsWith(".map")
		) {
			console.log("[Middleware] Blocked POST to static path", { pathname, ip });
			Sentry.captureMessage("Blocked POST to static file path", {
				level: "warning",
				extra: {
					pathname,
					ip,
					userAgent: req.headers.get("user-agent"),
				},
			});
			return applyNoCacheHeaders(new NextResponse(null, { status: 405 }));
		}

		// Log legitimate API POST requests
		if (isApiRoute) {
			console.log("[Middleware POST]", {
				url: req.url,
				method: req.method,
				contentType,
				timestamp: new Date().toISOString(),
			});
		}
	}

	const res = NextResponse.next();
	// Authenticated HTML must never be cached; public routes may remain cacheable.
	if (!isPublicRoute) {
		applyNoCacheHeaders(res);
	}
	return res;
}

export const config = {
	matcher: [
		// Match all paths except static files served directly
		"/((?!_next/image|favicon.ico).*)",
	],
};
