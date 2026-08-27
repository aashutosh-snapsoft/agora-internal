import { OnboardingUploadState } from "./chat";
/**
 * Represents an option in the onboarding chat.
 *
 * @interface OnboardingChatOption
 *
 * @property {string} text - The text displayed for this chat option.
 * @property {OnboardingChatState | null} next - The next state in the onboarding chat flow, or null if there is no next state.
 */
export interface OnboardingChatOption {
	/**
	 * Signifies the text to be displayed for this select option.
	 */
	label: string;

	/**
	 * The value to be returned when this option is selected.
	 */
	value: string;
}
