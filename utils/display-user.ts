import { User } from "@/types/user";

/**
 * Displays the user's full name if available, otherwise returns "Unknown".
 *
 * @param {User} [user] - The user object which may contain first and last name.
 * @returns {string} The full name of the user or "Unknown" if the name is not available.
 */
export function displayUser(user: User | undefined | null) {
	if (!user || !user.first_name || !user.last_name) {
		return "Unknown";
	}
	return `${user.first_name!} ${user.last_name!}`;
}
