"use client";

import { FC, useMemo } from "react";
import { Box } from "@mui/material";
import { useAppSelector } from "@/store/store";
import { selectAllowedRoles } from "@/store/auth/auth-selector";
import { userSelector } from "@/store/users/user-selectors";
import { LoadingScreen } from "@/components/loading-screen";
import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/button/button";
// NEW APP SHELL — same left rail as /projects
import ProjectsSidebar from "@/app/projects/ProjectsSidebar";
// PAGE SECTIONS (single page — no tabs)
import BasicInformation from "./BasicInformation";
import PasswordSection from "./basic-information/PasswordSection";
import DeleteAccount from "./DeleteAccount";
import Debug from "./Debug";

const AccountsPageView: FC = () => {
	const { authenticatedUser } = useAppSelector(userSelector);
	const allowedRoles = useAppSelector(selectAllowedRoles);
	const isOpsAdmin = useMemo(
		() => allowedRoles.includes("ops-admin"),
		[allowedRoles],
	);
	const onLogout = useLogout();

	if (!authenticatedUser) {
		return <LoadingScreen />;
	}

	return (
		<Box sx={{ display: "flex", height: "100dvh" }}>
			{/* App nav rail — matches /projects (no top header, new sidebar). */}
			<ProjectsSidebar fullHeight />
			<Box
				sx={{
					flex: 1,
					minWidth: 0,
					height: "100dvh",
					overflowY: "auto",
					// DS base surface (Neutral/50). Cards on top stay white.
					backgroundColor: "#FAFAFA",
				}}
			>
				<Box pt={2} pb={4}>
					{/* All settings on one page — a single reading column of sections. */}
					<Box
						sx={{
							maxWidth: 640,
							mx: "auto",
							px: 2,
							display: "flex",
							flexDirection: "column",
							gap: 4,
						}}
					>
						{/* DS page heading (Heading/Bold 22 + LG/Medium 14 subtext) with an
						    action on the right. Colors are DS tokens not yet in the theme —
						    see the token gap note in components/text-field. */}
						<Box
							sx={{ py: 1, display: "flex", alignItems: "center", gap: 5 }}
						>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Box
									component="h1"
									sx={{
										m: 0,
										fontSize: "22px",
										fontWeight: 700,
										lineHeight: "28px",
										color: "#121017",
									}}
								>
									Profile
								</Box>
								<Box
									component="p"
									sx={{
										m: 0,
										mt: "4px",
										fontSize: "14px",
										fontWeight: 500,
										lineHeight: "20px",
										color: "#555e69",
									}}
								>
									Manage your account information, password, and account
									settings.
								</Box>
							</Box>
							<Button variant="secondary" onClick={onLogout}>
								Logout
							</Button>
						</Box>

						<BasicInformation />
						<PasswordSection />
						<DeleteAccount />
						{isOpsAdmin && <Debug />}
					</Box>
				</Box>
			</Box>
		</Box>
	);
};

export default AccountsPageView;
