import { config } from "@/config";

/**
 * Builds an Auth0 login URL with proper audience and scope parameters.
 * This ensures consistent login URL construction across the application.
 * 
 * @param returnTo - Optional path to redirect to after login. Defaults to "/"
 * @returns The complete Auth0 login URL
 */
export function buildAuth0LoginUrl(returnTo?: string | null): string {
	const audience = config.auth0.audience || "";
	const scope = "openid profile email";
	const baseUrl = "/api/auth/login";
	
	const params = new URLSearchParams({
		audience,
		scope,
	});
	
	if (returnTo) {
		params.append("returnTo", returnTo);
	}
	
	return `${baseUrl}?${params.toString()}`;
}







