import { RootState } from "../store";
import { createSelector } from "@reduxjs/toolkit";

const getAuthState = (state: RootState) => state.auth;

export const authSelector = createSelector(
	[getAuthState],
	(authState) => authState
);

// Token selector removed - authentication is now session-based only
// Kept for backward compatibility but returns null
export const selectAuthToken = createSelector(
	[getAuthState],
	(_authState) => null
);

export const selectAuthUser = createSelector(
	[getAuthState],
	(authState) => authState.authUser
);

export const selectCurrentRole = createSelector(
	[getAuthState],
	(authState) => authState.currentRole
);

export const selectAllowedRoles = createSelector(
	[getAuthState],
	(authState) => authState.allowedRoles
);

export const selectAuthLoading = createSelector(
	[getAuthState],
	(authState) => authState.loading
);

export const selectAuthError = createSelector(
	[getAuthState],
	(authState) => authState.error
);

export const selectPermissions = createSelector(
	[getAuthState],
	(authState) => authState.permissions
);
