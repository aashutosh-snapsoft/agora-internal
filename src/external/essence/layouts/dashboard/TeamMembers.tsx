import CurrentTeamMembers from "@/components/invite-team-members/current-team-members";
import { useAppSelector } from "@/store/store";
import { TeamMember } from "@/types/teams";
import { Avatar, AvatarGroup, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import React from "react";
import { CustomTheme } from "../../theme/createTheme";
import { userSelector } from "@/store/users/user-selectors";
import { displayUser } from "../../../../../utils/display-user";
import { LoadingScreen } from "@/components/loading-screen";

const DisplayAvatars: React.FC<{ teamMembers: TeamMember[] }> = ({
	teamMembers,
}) => {
	return (
		<>
			{teamMembers.map((member) => (
				<Avatar key={member.id} alt={member.name} src={member.avatar ?? ""} />
			))}
		</>
	);
};

// Team Members Component
const TeamMembers: React.FC = () => {
	// const teamState = useAppSelector(teamSelector);
	// const teamMembers = teamState.members;
	const { authenticatedUser, loading } = useAppSelector(userSelector);
	const isAuthenticated = Boolean(authenticatedUser);

	const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
		{
			id: authenticatedUser?.id || "me",
			name: displayUser(authenticatedUser) || "You",
			avatar: authenticatedUser?.image_url || "",
		},
	]);

	const theme = useTheme<CustomTheme>();
	useEffect(() => {
		if (loading || !isAuthenticated) return;
		const me = {
			id: authenticatedUser?.id || "me",
			name: displayUser(authenticatedUser) || "You",
			avatar: authenticatedUser?.image_url || "",
		};
		setTeamMembers([me]);
	}, [loading, isAuthenticated, authenticatedUser]);

	const [open, setOpen] = useState(false);

	if (!authenticatedUser) return <LoadingScreen />;

	return (
		<>
			<AvatarGroup
				className="cursor-pointer"
				max={4}
				sx={{
					"& .MuiAvatar-root": {
						width: 32,
						height: 32,
						fontSize: theme.typography.Text6Medium.fontSize,
					},
				}}
			>
				<DisplayAvatars teamMembers={teamMembers} />
			</AvatarGroup>
			{open && (
				<CurrentTeamMembers
					open={open}
					onClose={() => setOpen(!open)}
					project_team={teamMembers}
					setCurrentTeam={setTeamMembers}
				/>
			)}
		</>
	);
};

export default TeamMembers;
