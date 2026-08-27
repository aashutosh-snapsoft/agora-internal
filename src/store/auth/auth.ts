import { createSlice } from "@reduxjs/toolkit";
// Note: User type from Auth0 - kept for backward compatibility
type User = {
	sub?: string;
	name?: string;
	email?: string;
	picture?: string;
	[key: string]: any;
};
import { config } from "@/config";
interface AuthState {
	// Token removed - authentication is now session-based only
	authUser: User | null | undefined;
	currentRole: string | null;
	allowedRoles: string[];
	permissions: string[];
	loading: boolean;
	error: string | null;
}

const initialState: AuthState = {
	authUser: null,
	currentRole: null,
	allowedRoles: [],
	permissions: [],
	loading: false,
	error: null,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		clearToken(state) {
			// Token removed - kept for backward compatibility, only clears user state
			state.authUser = null;
			// localStorage.removeItem("authToken"); // Removed - no client-side tokens
		},
		setUserMode(state, action) {
			const allowedRoles = state.allowedRoles;
			const newRole = action.payload;
			if (allowedRoles.includes(newRole)) {
				state.currentRole = newRole;
			} else {
				throw new Error("Invalid user mode");
			}
		},
	},
	extraReducers: (builder) => {
		// Token fetching removed - authentication is now session-based only
		// No extraReducers needed for token flow
	},
});

export const { clearToken, setUserMode } = authSlice.actions;
export default authSlice.reducer;
