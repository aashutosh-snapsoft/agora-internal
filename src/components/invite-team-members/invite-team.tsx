import { Box, Button, Modal, Typography } from "@mui/material";
import React, { Dispatch, SetStateAction, useState } from "react";
import { ArrowBack } from "@mui/icons-material";
import InviteCollaborators from "./invite-collaborators-dropdown";
import { TeamMember } from "@/types/teams";
import { useAppSelector } from "@/store/store";
import { teamSelector } from "@/store/team/team-selectors";

const InviteTeam = ({
	open,
	onClose,
	setCurrentTeam,
}: {
	open: boolean;
	onClose: () => void;
	setCurrentTeam: Dispatch<SetStateAction<TeamMember[]>>;
}) => {
	const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
	const teamState = useAppSelector(teamSelector);
	const teamMembers = teamState.members;
	/**
	 * Handles the save action for inviting team members.
	 * Maps the selected members to a new array with their id, name, and avatar,
	 * then updates the current team state with the new array and closes the modal.
	 *
	 * @returns {void}
	 */
	const handleSave = () => {
		const selectedTeamMembers: TeamMember[] = selectedMembers;

		setCurrentTeam((prevTeam: TeamMember[]) => {
			const newMembers = selectedTeamMembers.filter(
				(newMember) => !prevTeam.some((member) => member.id === newMember.id)
			);
			return [...prevTeam, ...newMembers];
		});
		onClose();
	};

	return (
		<Modal open={open} onClose={onClose} aria-labelledby="modal-title">
			<Box
				sx={{
					width: 500,
					bgcolor: "background.paper",
					borderRadius: 2,
					boxShadow: 24,
					p: 4,
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
				}}
			>
				<Box display="flex" alignItems="center" mb={2} gap={2}>
					<ArrowBack onClick={onClose} />
					<Typography variant="Text6Medium">Invite Collaborator</Typography>
				</Box>
				<Box>
					<InviteCollaborators
						teamMembers={teamMembers}
						selectedMembers={selectedMembers}
						setSelectedMembers={setSelectedMembers}
					/>
				</Box>
				<Box
					className="footer-flex-box"
					style={{ display: "flex", justifyContent: "flex-start" }}
				>
					<Button
						title="Cancel"
						variant="outlined"
						onClick={onClose}
						sx={{ mr: 2 }}
					>
						Cancel
					</Button>
					<Button
						title="Mark as correct"
						variant="contained"
						onClick={handleSave}
						sx={{ mr: 2 }}
					>
						Save
					</Button>
				</Box>
			</Box>
		</Modal>
	);
};

export default InviteTeam;
