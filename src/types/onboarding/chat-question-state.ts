/**
 * Enum representing the different states of onboarding chat questions.
 *
 * @enum {string}
 * @property {string} BUSINESS_TYPE_PUBLIC_OR_PRIVATE - Represents the state where the user is asked about their business being public or private.
 * @property {string} PROJECT_TYPE - Represents the state where the project type is being queried.
 * @property {string} UPLOAD - Represents the state where a document upload is prompted.
 * @property {string} COMPLETED - Represents that the onboarding questions are done.
 */
export enum OnboardingChatQuestionState {
	BUSINESS_TYPE_PUBLIC_OR_PRIVATE = "business_type",
	PROJECT_TYPE = "project_type",
	UPLOAD = "upload",
	COMPLETED = "completed",
}
