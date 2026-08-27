/**
 * The props for the CategoryDropdown component.
 *
 * @param {string} value - The value of the selected category.
 * @param {Function} onChange - The function to call when the selected category changes.
 * @param {string} modelTemplateId - The ID of the model template to use for filtering the categories.
 */
export interface CategoryDropdownProps {
	value: string;
	onChange: (value: string) => void;
	modelTemplateId: string;
	isHighlighted?: boolean;
	highlightColor?: string;
	fontSize?: string;
	variant?: "compact" | "modal";
	disabled?: boolean;
	showLoadingIndicator?: boolean;
	includeStructuralOptions?: boolean;
}
