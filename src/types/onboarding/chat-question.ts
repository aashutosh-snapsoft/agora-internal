import { OnboardingUploadState } from "./chat";
import { OnboardingChatOption } from "./chat-option";
import { OnboardingChatQuestionState } from "./chat-question-state";

/**
 * Represents a question in the onboarding chat.
 *
 * @typedef {Object} Question
 *
 * @property {OnboardingUploadState} id - The unique identifier for the question, represented by the onboarding chat state.
 * @property {string} prompt - The text prompt of the question.
 * @property {OnboardingChatOption[]} options - An array of possible options for the question.
 * @property {OnboardingChatQuestionState} [state] - The current state of the question, which is optional.
 */
export type Question = {
	id: OnboardingUploadState;
	prompt: string;
	options: OnboardingChatOption[];
	state?: OnboardingChatQuestionState;
};
