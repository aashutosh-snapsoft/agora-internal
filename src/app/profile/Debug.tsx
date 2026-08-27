import {
	Button,
	Card,
	Divider,
	Stack,
	Box,
	Checkbox,
	SelectChangeEvent,
} from "@mui/material";
// CUSTOM COMPONENTS
import { H6, Paragraph } from "@/components/typography";
import StyledDropdown, {
	DropdownOption,
} from "@/components/Dropdown/styled-dropdown";
import { useState } from "react";
import { FC } from "react";
import { useAppDispatch, useAppSelector } from "@/store/store";
import LoadingSkeleton from "@/components/loader/LoadingSkeleton";
import { setUserMode as setUserModeAction } from "@/store/auth/auth";
const Debug: FC = () => {
	const { currentRole, allowedRoles, authUser, loading } = useAppSelector(
		(state) => state.auth
	);
	const dispatch = useAppDispatch();

	const getRoleLabel = (role: string) => {
		switch (role) {
			case "decision-collaborator":
				return "Decision Collaborator";
			case "executive-partner":
				return "Executive Partner";
			case "guest":
				return "Guest";
			case "ops-admin":
				return "Ops Admin";
			case "user":
				return "User";
			default:
				return role;
		}
	};
	const [userMode, setUserMode] = useState<string>(currentRole || "");
	const [userModeOptions, setUserModeOptions] = useState<DropdownOption[]>(
		allowedRoles.map((role) => ({
			value: role,
			label: getRoleLabel(role),
		}))
	);

	const handleUserModeChange = (event: SelectChangeEvent<any>) => {
		setUserMode(event.target.value);
		dispatch(setUserModeAction(event.target.value));
	};

	if (loading) {
		return <LoadingSkeleton />;
	}

	return (
		<Card sx={{ pb: 3 }}>
			<Box padding={3}>
				<H6 fontSize={14}>Change User Mode</H6>
				<Paragraph mt={0.5} fontSize={13} lineHeight={1.7} maxWidth={600}>
					Change your default user mode here, which toggles certain features on
					the app. Note: this feature is only visible for users with the{" "}
					<code>ops-admin</code> role.
				</Paragraph>
			</Box>
			<Divider />

			<Stack direction="row" alignItems="center" padding={3} pl={2}>
				<StyledDropdown
					value={userMode}
					onChange={handleUserModeChange}
					options={userModeOptions}
				/>
			</Stack>

			<Box pl={3} maxWidth={120}>
				<Button color="error" fullWidth>
					Delete
				</Button>
			</Box>
		</Card>
	);
};

export default Debug;
