/**
 * Utility to format titles by removing hyphens (if present) and capitalizing words.
 * @param title - The raw title string to format.
 * @returns The formatted title.
 * @deprecated Use taxonomy labels instead of this function.
 */
export const formatTitle = (title: string): string => {
	if (!title) return "";

	// Split by hyphen or whitespace to handle both cases, then capitalize and join
	return title
		.split(/-| /) // Split by hyphen or space
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
		.join(" "); // Join back with spaces
};
