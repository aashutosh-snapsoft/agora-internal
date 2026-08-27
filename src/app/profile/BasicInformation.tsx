import { useState, useEffect } from "react";
import { Card } from "@mui/material";
import LinearProgress from "@mui/material/LinearProgress";
import { useAppDispatch } from "@/store/store";
import {
	fetchAuthenticatedUser,
	updateUserProfile,
} from "@/store/users/user-thunks";
import type { User } from "@/types/user";
import ProfileForm from "./basic-information/ProfileForm";

// Form interface for type safety
interface FormValues {
	firstName: string;
	lastName: string;
	title: string;
	organization: string;
	email: string;
}

const normalizeUser = (fetchedUser: User): User => ({
	...fetchedUser,
	organization:
		fetchedUser.organization ||
		fetchedUser.tenant?.display_label ||
		"",
});

const BasicInformation = () => {
	const dispatch = useAppDispatch();
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		dispatch(fetchAuthenticatedUser())
			.unwrap()
			.then((fetchedUser) => {
				setUser(normalizeUser(fetchedUser));
			})
			.catch((error) => console.error("Failed to fetch user:", error))
			.finally(() => setIsLoading(false));
	}, [dispatch]);

	const handleSaveChanges = async (values: FormValues, userId: string) => {
		try {
			const { organization, ...restValues } = values;
			const userData = {
				first_name: restValues.firstName,
				last_name: restValues.lastName,
				title: restValues.title,
			};
			
			// Update local state immediately for instant UI update
			setUser(prevUser => {
				if (!prevUser) return null;
				return {
					...prevUser,
					...userData,
					organization,
				};
			});
			
			// .unwrap() re-throws on rejection so the catch block below can revert UI.
			await dispatch(updateUserProfile({ userId, userData })).unwrap();
		} catch (error) {
			console.error("Failed to update profile:", error);
			// Revert local state on error
			dispatch(fetchAuthenticatedUser()).then((result) => {
				if (result.meta.requestStatus === 'fulfilled' && result.payload) {
					const refreshedUser = result.payload as User;
					setUser(normalizeUser(refreshedUser));
				}
			});
			throw error;
		}
	};

	if (isLoading || !user) {
		return (
			<Card sx={{ padding: 3, position: "relative" }}>
				<LinearProgress />
			</Card>
		);
	}

	return (
		<ProfileForm
			user={user}
			onSubmit={handleSaveChanges}
			loginEmail={user.email}
		/>
	);
};

export default BasicInformation;
