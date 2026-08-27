/**
 * @deprecated This thunk is no longer actively used after migration to @auth0/nextjs-auth0.
 * Tokens are now managed server-side via HttpOnly cookies.
 * This is kept for backward compatibility with the auth slice.
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "@/store/store";
import * as amplitude from "@amplitude/analytics-browser";

// Local type definitions (replacing @auth0/auth0-react types)
interface User {
	sub?: string;
	name?: string;
	email?: string;
	picture?: string;
	[key: string]: any;
}

interface Auth0ContextInterface {
	isLoading: boolean;
	user: User | undefined;
	getAccessTokenSilently: () => Promise<string>;
}

const blacklistUserDomains = ["@socratics.ai"];

/**
 * Get the access token from the Auth0 context.
 *
 * @deprecated This thunk is deprecated. Tokens are now managed server-side.
 * 
 * Note that this is not a pure function.
 *
 * It can attempt to regenerate the token if it is expired, which means
 * it performs a network call and overwrites the token in the store.
 *
 * To do this, it uses both a refresh token and session cookies.
 * See:
 * - https://github.com/auth0/auth0-spa-js/blob/f2e566849efa398ca599daf9ebdfbbd62fcb1894/src/Auth0Client.ts#L643
 * - https://auth0.com/docs/authenticate/login/configure-silent-authentication#testing
 *
 * @param auth0Context - The Auth0 context.
 * @returns The access token and user.
 */
export const getAccessToken = createAsyncThunk<
	{ token: string; user: User | undefined },
	Auth0ContextInterface
>("auth/getAccessToken", async (auth0Context, thunkAPI) => {
	try {
		// Wait until Auth0 context is ready (with 10 second timeout)
		const startTime = Date.now();
		while (auth0Context.isLoading) {
			if (Date.now() - startTime > 10000) {
				throw new Error("Timeout waiting for Auth0 to initialize");
			}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		const token = await auth0Context.getAccessTokenSilently();
		const user = auth0Context.user;

		const identify = new amplitude.Identify();
		const inBlacklist = blacklistUserDomains.some((domain) =>
			user?.email?.includes(domain)
		);

		const hasAgoraEmail = user?.email?.includes("+agora");
		const isTestUser = (inBlacklist || hasAgoraEmail) ?? false;
		identify.set("is_test_user", isTestUser);
		amplitude.identify(identify);

		amplitude.track("Get Token", {
			email: user?.email,
			external_id: user?.sub,
		});

		return { token, user };
	} catch (error: any) {
		if (error?.message === "Login required") {
			// Token removed - authentication is now session-based only
			// Get the existing user from the store (if any)
			const state = thunkAPI.getState() as RootState;
			const existingUser = state.auth.authUser;

			// If we have existing user, log the failure
			if (existingUser) {
				amplitude.track("Log in failed", {
					case: 4,
				});
				throw new Error(`Fetch token failed: ${error?.message || error}`);
			}
		}

		amplitude.track("Log in failed", {
			case: 3,
		});
		throw new Error(`Fetch token failed: ${error?.message || error}`);
	}
});
