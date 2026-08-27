import {
	OnboardingChatState,
	OnboardingUploadState,
} from "@/types/onboarding/main";
import { Project } from "@/types/project";

/**
 * Determines the next chat state after the Setup phase was removed.
 */
export function determineNextChatState(
	currentState: OnboardingChatState,
	uploadState: OnboardingUploadState,
	project: Project | null
): OnboardingChatState {
	// Signature still accepts project data for compatibility, even though the setup
	// path no longer depends on those values.
	void project;

	switch (uploadState) {
		case OnboardingUploadState.INITIAL:
			return OnboardingChatState.UPLOAD_FILES;
		case OnboardingUploadState.NO_VALID_DOCUMENTS:
		case OnboardingUploadState.PROCESSING_FAILED:
			return OnboardingChatState.UPLOAD_FILES;
		case OnboardingUploadState.UPLOADED:
		case OnboardingUploadState.PROCESSING_DATA:
		case OnboardingUploadState.PROCESSING_FINANCIALS:
		case OnboardingUploadState.GENERATING_SUMMARY_ROLLUPS:
			if (
				currentState === OnboardingChatState.LOADING ||
				currentState === OnboardingChatState.UPLOAD_FILES
			) {
				return OnboardingChatState.PROJECT_DETAILED;
			}
			return currentState;
		case OnboardingUploadState.FINANCIAL_MODEL_READY:
			return OnboardingChatState.FINANCIAL_MODEL_COMPLETE;
		default:
			return currentState;
	}
}
