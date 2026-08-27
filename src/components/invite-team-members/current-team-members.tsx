import React, { Dispatch, SetStateAction, useState } from "react";
import { Box, Modal, Typography } from "@mui/material";
import UserAddIcon from "../icons/UserAddIcon";
import { SearchInput } from "../search-input";
import {
	StyledAddButton,
	StyledAvatar,
	StyledListItem,
	StyledRemoveButton,
	StyledTypography,
} from "./invite-team-members-styles";
import InviteTeam from "./invite-team";
import { TeamMember } from "@/types/teams";
import { userSelector } from "@/store/users/user-selectors";
import { useAppSelector } from "@/store/store";

const CurrentTeamMembers = ({
	open,
	onClose,
	project_team,
	setCurrentTeam,
}: {
	open: boolean;
	onClose: () => void;
	project_team: TeamMember[];
	setCurrentTeam: Dispatch<SetStateAction<TeamMember[]>>;
}) => {
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [addTeamMember, setAddTeamMember] = useState<boolean>(false);
	const { authenticatedUser } = useAppSelector(userSelector);
	// Filter team members based on search query
	const filteredTeam = project_team.filter((member) =>
		member.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Remove a team member by ID
	const removeTeamMember = (id: string) => {
		setCurrentTeam(project_team.filter((member) => member.id !== id));
	};

	const addTeamMemberPopup = () => {
		setAddTeamMember(!addTeamMember);
	};

	return (
		<>
			<Modal open={open} onClose={onClose} aria-labelledby="modal-title">
				<Box
					sx={{
						display: addTeamMember ? "none" : "inherit",
						width: 500,
						bgcolor: "background.paper",
						borderRadius: 2,
						boxShadow: 24,
						p: 1.5,
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
					}}
				>
					<Box
						display="flex"
						justifyContent="space-between"
						alignItems="center"
						mb={2}
					>
						<Typography variant="Text6Medium">Project Collaborators</Typography>
						{/* <StyledAddButton
							sx={{
								height: 24,
								paddingTop: 0.5,
								paddingBottom: 0.5,
								fontSize: "14px",
							}}
							onClick={addTeamMemberPopup}
							disabled={true}
						>
							<UserAddIcon height="16px" width="16px" />
							Add
						</StyledAddButton> */}
					</Box>
					<Box display="flex" flexDirection={"column"} mb={4}>
						{/* <Box className="mb-4 w-auto">
							<SearchInput
								placeholder="Search Team"
								className="min-w-full"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								sx={{
									fontSize: "14px",
								}}
							/>
						</Box> */}
						{filteredTeam.length > 0 ? (
							filteredTeam.map((member) => (
								<StyledListItem
									key={member.id}
									display="flex"
									justifyContent={"space-between"}
									alignItems="center"
								>
									<Box display="flex" alignItems="center" gap={1}>
										<StyledAvatar alt={member.name} src={member.avatar ?? ""} />
										<Typography variant="Text6Medium">{member.name}</Typography>
									</Box>

									{member.id !== authenticatedUser?.id && (
										<StyledRemoveButton
											variant="text"
											onClick={() => removeTeamMember(member.id)}
										>
											Remove
										</StyledRemoveButton>
									)}
								</StyledListItem>
							))
						) : (
							<StyledTypography>No team members found.</StyledTypography>
						)}
					</Box>
				</Box>
			</Modal>
			{addTeamMember && (
				<InviteTeam
					open={addTeamMember}
					onClose={addTeamMemberPopup}
					setCurrentTeam={setCurrentTeam}
				/>
			)}
		</>
	);
};

export default CurrentTeamMembers;
