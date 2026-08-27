import { useAppDispatch } from "@/store/store";
import { config } from "@/config";
import { useCallback } from "react";
import { logoutUser } from "@/store/users/user-thunks";

export const useLogout = (redirectTo: string = `${config.url}/welcome`) => {
	const dispatch = useAppDispatch();

	return useCallback(() => {
		// Use Next.js Auth0 SDK logout route
		dispatch(
			logoutUser({
				logout: async () => {
					window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(redirectTo)}`;
				},
			})
		);
	}, [dispatch, redirectTo]);
};
