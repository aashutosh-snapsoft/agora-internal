/**
 * Server-side session helpers for Auth0 Next.js SDK
 * 
 * These helpers provide access to the user session on the server side.
 * Use getSession() in API routes, Server Components, and getServerSideProps.
 */

import { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Get the current user session (server-side)
 * 
 * @param req - Next.js request object (for API routes) or cookies (for Server Components)
 * @param res - Next.js response object (for API routes, optional for Server Components)
 * @returns User session or null if not authenticated
 * 
 * @example
 * // In API route:
 * const session = await getSession(req, res);
 * 
 * @example
 * // In Server Component:
 * import { cookies } from 'next/headers';
 * const session = await getSessionFromCookies(cookies());
 */
export async function getSessionFromRequest(
	req: NextRequest
): Promise<Awaited<ReturnType<typeof auth0.getSession>>> {
	return await auth0.getSession(req);
}

/**
 * Get access token from session (server-side only)
 * 
 * @param session - User session from getSession()
 * @returns Access token or null
 */
export function getAccessTokenFromSession(
	session: Awaited<ReturnType<typeof auth0.getSession>>
): string | null {
	if (!session?.tokenSet?.accessToken) {
		return null;
	}
	return session.tokenSet.accessToken;
}

/**
 * Get user role from session claims
 * 
 * @param session - User session from getSession()
 * @returns User role or null
 */
export function getUserRoleFromSession(session: Awaited<ReturnType<typeof auth0.getSession>>): string | null {
	if (!session?.user) {
		return null;
	}
	
	// Check for role in various claim locations
	const user = session.user as any;
	return user.role || user['https://socratics.ai/role'] || null;
}

/**
 * Get user organization from session claims
 * 
 * @param session - User session from getSession()
 * @returns User organization ID or null
 */
export function getUserOrgFromSession(session: Awaited<ReturnType<typeof auth0.getSession>>): string | null {
	if (!session?.user) {
		return null;
	}
	
	const user = session.user as any;
	return user.org || user['https://socratics.ai/org'] || user.tenant_id || null;
}







