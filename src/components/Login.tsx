import React from "react";
import { styled } from "@mui/material";
// CUSTOM COMPONENTS
import { Paragraph } from "@/external/essence/components/typography";

import { useAppDispatch, useAppSelector } from "@/store/store";
import { logoutUser } from "@/store/users/user-thunks";
import { config } from "@/config";
import { buildAuth0LoginUrl } from "@/utils/auth0";
import { userSelector } from "@/store/users/user-selectors";

const StyledSmall = styled(Paragraph)(({ theme }) => ({
	fontSize: 13,
	display: "block",
	cursor: "pointer",
	padding: "5px 1rem",
	"&:hover": { backgroundColor: theme.palette.action.hover },
}));

const LoginButton = ({
	className,
	returnTo,
}: {
	className?: string;
	returnTo?: string;
}) => {
	const { authenticatedUser, loading } = useAppSelector(userSelector);
	const isAuthenticated = Boolean(authenticatedUser);
	const dispatch = useAppDispatch();

	const handleLogin = () => {
		// Use Next.js Auth0 SDK login route
		const loginUrl = buildAuth0LoginUrl(returnTo || undefined);
		window.location.href = loginUrl;
	};

	const handleLogout = () => {
		const customLogout = async () => {
			console.info("logging out", {
				returnToUrl: `${config.url}/`,
			});
			// Use Next.js Auth0 SDK logout route
			window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(`${config.url}/`)}`;
		};
		dispatch(logoutUser({ logout: customLogout }));
	};

	if (loading) {
		return <StyledSmall>Loading...</StyledSmall>;
	}

	if (isAuthenticated) {
		return (
			<StyledSmall onClick={handleLogout} className={className}>
				Log out
			</StyledSmall>
		);
	}

	return (
		<StyledSmall onClick={handleLogin} className={className}>
			Log in
		</StyledSmall>
	);
};

export default LoginButton;
