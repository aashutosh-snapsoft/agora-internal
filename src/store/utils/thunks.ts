import {
	AsyncThunkPayloadCreatorReturnValue,
	createAsyncThunk,
	GetThunkAPI,
} from "@reduxjs/toolkit";
import { RootState } from "../store";
import {
	createHasuraService,
	getHasuraService,
} from "@/services/hasura.factory";
import { HasuraService } from "@/services/hasura.service";
import { config } from "@/config";

/**
 * The create hasura thunk is a wrapper around the createAsyncThunk that adds a hasura service to the thunk.
 *
 * When constructing a thunk, you can now have three parameters:
 * - typePrefix: The type prefix for the thunk.
 * - payloadCreator: The payload creator for the thunk.
 * - api: The api for the thunk.
 *
 * On the API for the thunk, you can access the usual variables like getState, rejectWithValue, etc.
 *
 * This ensures consistency in the way we handle thunks that utilize the hasura service, and ensures
 * we only use a single hasura instance via the hasura service factory.
 *
 * @param typePrefix
 * @param payloadCreator
 * @returns A thunk action creator that handles Hasura service injection
 */
export const createHasuraThunk = <
	ReturnType extends AsyncThunkPayloadCreatorReturnValue<any, any>,
	ArgType = void
>(
	typePrefix: string,
	payloadCreator: (
		arg: ArgType,
		hasuraService: HasuraService,
		api: GetThunkAPI<{ state: RootState }>
	) => Promise<ReturnType>
) => {
	return createAsyncThunk<ReturnType, ArgType, { state: RootState }>(
		typePrefix,
		async (arg, api) => {
			const { auth } = api.getState();

			if (auth.error) throw new Error(auth.error);
			
			try {
				// Get or determine role - use currentRole from state if available, otherwise default to "user"
				const role = auth.currentRole || "user";
				
				// With BFF pattern, HasuraService doesn't need tokens - auth is handled server-side
				let hasuraService = getHasuraService();
				if (!hasuraService) {
					// Create hasura service without token provider (BFF handles auth)
					hasuraService = HasuraService.createWithBearer({
						role: role,
						getAccessToken: async () => {
							// This should never be called - BFF handles auth
							throw new Error("Token access not supported - use BFF pattern");
						},
						logout: () => {
							window.location.href = "/api/auth/logout";
						},
					});
				}
				return await payloadCreator(arg, hasuraService, api);
			} catch (error: any) {
				const errorMessage = error?.message ?? error;
				// Organizations/tenants are optional; surface errors but do not hard-block UI
				throw new Error(errorMessage);
			}
		}
	);
};
