import { createSlice } from '@reduxjs/toolkit';
import { User } from '@/types/user';
import { fetchAuthenticatedUser, logoutUser, updateUserProfile } from './user-thunks';

/**
 * Represents the state of the user store.
 * 
 * @interface UserState
 * @property {User[] | null} users - The list of users. It can be null if no users are loaded.
 * @property {User | null} authenticatedUser - The currently authenticated user. It can be null if no user is authenticated.
 * @property {boolean} loading - Indicates whether the user data is currently being loaded.
 * @property {string | null} error - The error message if there was an error loading the user data. It can be null if there is no error.
 */
interface UserState {
    users: User[] | null;
    authenticatedUser: User | null;
    loading: boolean;
    authResolved: boolean;
    error: string | null;
}

const initialState: UserState = {
    users: null,
    authenticatedUser: null,
    loading: false,
    authResolved: false,
    error: null,
};


const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // Fetch Authenticated User
        builder
            .addCase(fetchAuthenticatedUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAuthenticatedUser.fulfilled, (state, action) => {
                state.loading = false;
                state.authenticatedUser = action.payload;
                state.authResolved = true;
            })
            .addCase(fetchAuthenticatedUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch authenticated user';
                state.authenticatedUser = null;
                state.authResolved = true;
            });

        // Logout User
        builder
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state.authenticatedUser = null;
                state.error = null;
                state.authResolved = false;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.loading = false;
                state.authenticatedUser = null;
                state.error = action.error.message || 'Failed to logout user';
                state.authResolved = false;
            });

        // Update User Profile
        builder
            .addCase(updateUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                // Note: The thunk only returns the user ID, so we need to refetch the user
                // or update the local state manually. For now, we'll refetch.
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update user profile';
            });
    },
});

export default userSlice.reducer;


/**
 * A slice for managing user-related state in the Redux store.
 * 
 * This slice handles the following actions:
 * - `fetchUsers`: Fetches a list of users.
 * - `fetchAuthenticatedUser`: Fetches the authenticated user's details.
 * - `logoutUser`: Logs out the authenticated user.
 * 
 * The state managed by this slice includes:
 * - `loading`: A boolean indicating whether a request is in progress.
 * - `error`: An error message if a request fails.
 * - `users`: An array of user objects.
 * - `authenticatedUser`: The authenticated user's details.
 * 
 * The slice uses `createSlice` from Redux Toolkit to define the initial state,
 * reducers, and extra reducers for handling asynchronous actions.
 */
