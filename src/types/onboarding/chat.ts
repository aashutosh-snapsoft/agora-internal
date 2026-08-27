/**
 * This enum represents the secondary upload state, which are the substates under the
 * OnboardingChatState.UPLOAD_FILES primary state.
 *
 * @enum {string}
 */
export enum OnboardingUploadState {
	/**
	 * The initial state of the onboarding chat.
	 *
	 * This is used when the selected project has zero documents and is requesting the user
	 * to upload a document.
	 */
	INITIAL = "initial",
	/**
	 * The state where the user has uploaded a document but it is not valid.
	 *
	 * This is the case where there may be one or more excel sheets in the uploaded files,
	 * but none of them are valid financial statements.
	 *
	 * In this case, the user is informed that their data is saved, but they
	 * need to upload a valid financial statement.
	 */
	NO_VALID_DOCUMENTS = "no-valid-documents",

	/**
	 * The state where the user has successfully uploaded the file.
	 */
	UPLOADED = "uploaded",

	/**
	 * The state where the user has succesfully submitted data, but is currently waiting for the
	 * file to be processed in determining the data type.
	 *
	 * Specifically, this occurs when the document type is still undetermined i.e. NULL, and the
	 * date time of processing is less than 3 minutes.
	 *
	 * It is assumed that determining this type does not take longer than 3 minutes.
	 */
	PROCESSING_DATA = "processing-data",

	/**
	 * The state where the user has succesfully submitted data, but the processing failed.
	 *
	 * This is the case where the user has uploaded a document, and its type has not yet been
	 * determined, and the processing time has exceeded 3 minutes.
	 *
	 * This is unexpected and so the user should be informed that their data processing
	 * failed.
	 */
	PROCESSING_FAILED = "processing-failed",

	/**
	 * The state where the user has succesfully submitted data, but is currently waiting for the
	 * file to be processed in determining the data type.
	 *
	 * Specifically, this occurs when:
	 * - the document type has been determined to be a financial statement
	 * - we assume that the IS and the BS already exist as financial model components
	 * - There are currently zero line items related to the build content
	 *
	 * In this case, we can have dynamic status messaging to the user using redis, but we'll
	 * get to that later.
	 */
	PROCESSING_FINANCIALS = "processing-financials",

	/**
	 * The state where the user has submitted valid data accepted by our ingestion, and
	 * now have reported line items in the financial model.
	 *
	 * However, there are no summary rollups yet, so it is currently being generated.
	 */
	GENERATING_SUMMARY_ROLLUPS = "generating-summary-rollups",

	/**
	 * The state where the user has succesfully submitted data, and the financial model is ready.
	 *
	 * This is the case where the user has uploaded a document, ingestion has completed, and
	 * the financial model has been calculated- thus having summary rollups available.
	 */
	FINANCIAL_MODEL_READY = "ready",
}

/**
 * This enum represents the primary state for managing our onboarding chat.
 * The Setup path was removed, so the chat now progresses from uploads to
 * the project detailed messaging and finally to the completed state.
 */
export enum OnboardingChatState {
	LOADING = "loading",
	UPLOAD_FILES = "upload-files",
	/**
	 * Represents that the user has already detailed the project and is waiting for the financial
	 * model to be completed.
	 */
	PROJECT_DETAILED = "project-detailed",
	/**
	 * Represents that the user has already detailed the project and is waiting for the financial
	 * model to be completed.
	 */
	FINANCIAL_MODEL_COMPLETE = "financial-model-complete",
}
