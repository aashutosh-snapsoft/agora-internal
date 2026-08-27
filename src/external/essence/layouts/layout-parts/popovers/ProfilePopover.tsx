import React, { Fragment, useRef, useState } from "react";
import { Box, styled, Divider, ButtonBase } from "@mui/material";
// CUSTOM COMPONENTS
import PopoverLayout from "./PopoverLayout";
import { FlexBox } from "@/external/essence/components/flexbox";
import { AvatarLoading } from "@/components/avatar-loading";
import { H6, Paragraph, Small } from "@/external/essence/components/typography";
import LoginButton from "@/components/Login";
import AvatarSelector from "@/components/avatar-selector/AvatarSelector";
// CUSTOM DEFINED HOOK
import useNavigate from "@/external/essence/hooks/useNavigate";
// CUSTOM UTILS METHOD
import { isDark } from "@/external/essence/utils/constants";
import { getInitials } from "@/lib/utils/getNameInitials";
import { useAppSelector } from "@/store/store";
import { userSelector } from "@/store/users/user-selectors";
import { displayUser } from "@/../utils/display-user";
import { useAvatarContext } from "@/context/avatar-context";
import { LoadingScreen } from "@/components/loading-screen";

// STYLED COMPONENTS
const StyledButtonBase = styled(ButtonBase)(({ theme }) => ({
	marginLeft: 8,
	borderRadius: 30,
	border: `1px solid ${theme.palette.grey[isDark(theme) ? 800 : 200]}`,
	"&:hover": { backgroundColor: theme.palette.action.hover },
}));

const StyledSmall = styled(Paragraph)(({ theme }) => ({
	fontSize: 13,
	display: "block",
	cursor: "pointer",
	padding: "5px 1rem",
	"&:hover": { backgroundColor: theme.palette.action.hover },
}));

const ProfilePopover = () => {
	const anchorRef = useRef(null);
	const navigate = useNavigate();
	const { authenticatedUser } = useAppSelector(userSelector);
	const isAuthenticated = Boolean(authenticatedUser);
	const userName = authenticatedUser ? displayUser(authenticatedUser) : "";
	const userEmail = authenticatedUser?.email;
	const [open, setOpen] = useState(false);
	const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
	
	// Use centralized avatar management
	const { currentAvatar, saveAvatar, getAvatarUrl } = useAvatarContext();

	if (!authenticatedUser) {
		return <LoadingScreen />;
	}


	// Calculate width based on email length
	const calculateWidth = () => {
		if (!userEmail) return 200;
		const emailLength = userEmail.length;
		// Base width: 200px, add 8px per character beyond 20 chars
		return Math.max(200, Math.min(400, 200 + (emailLength - 15) * 8));
	};

	const handleMenuItem = (path: string) => () => {
		navigate(path);
		setOpen(false);
	};

	const handleCloseAvatarSelector = () => {
		setIsAvatarSelectorOpen(false);
	};

	const handleSaveAvatar = async (newAvatarUrl: string) => {
		// First update the local state immediately for instant UI feedback
		// Then save to database
		await saveAvatar(newAvatarUrl);
	};

	return (
		<Fragment>
			<StyledButtonBase ref={anchorRef} onClick={() => setOpen(true)}>
				<AvatarLoading
					key={`profile-popover-avatar-${currentAvatar}`}
					alt={getInitials(userName)}
					percentage={0}
					borderSize={0}
					src={getAvatarUrl()}
					onClick={() => setOpen(true)}
				/>
			</StyledButtonBase>

			<PopoverLayout
				hiddenViewButton
				maxWidth={calculateWidth()}
				minWidth={200}
				popoverOpen={open}
				anchorRef={anchorRef}
				popoverClose={() => setOpen(false)}
				title={
					<>
						{isAuthenticated && (
							<FlexBox alignItems="center" gap={1} component="header">
								<Box>
									<H6 fontSize={14}>{userName}</H6>
									<Small color="text.secondary" display="block">
										{userEmail}
									</Small>
								</Box>
							</FlexBox>
						)}
						{!isAuthenticated && (
							<FlexBox alignItems="center" gap={1} component="header">
								<Box>
									<H6 fontSize={14}>Welcome!</H6>
									<Small color="text.secondary" display="block">
										Please login to continue.
									</Small>
								</Box>
							</FlexBox>
						)}
					</>
				}
			>
				{isAuthenticated && (
					<Box pt={1}>
						<StyledSmall onClick={handleMenuItem("/profile")}>
							Account profile
						</StyledSmall>

						<StyledSmall onClick={handleMenuItem("/support")}>
							Support
						</StyledSmall>

						<Divider sx={{ my: 1 }} />

						<LoginButton />
					</Box>
				)}

				{!isAuthenticated && (
					<Box pt={1}>
						<LoginButton />
					</Box>
				)}
			</PopoverLayout>

			{/* Avatar Selector Dialog */}
			<AvatarSelector
				open={isAvatarSelectorOpen}
				onClose={handleCloseAvatarSelector}
				onSave={handleSaveAvatar}
				currentAvatar={currentAvatar}
				showSaveButton={true}
			/>
		</Fragment>
	);
};

export default ProfilePopover;
