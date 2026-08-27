/**
 * Enum representing the status of an upload process.
 *
 * @enum {string}
 * @property {string} IDLE - The upload process has not started.
 * @property {string} UPLOADING - The upload process is currently in progress.
 * @property {string} UPLOADED - The upload process has completed successfully.
 * @property {string} FAILED - The upload process has failed.
 */
export enum UploadStatus {
	IDLE = "idle",
	UPLOADING = "uploading",
	UPLOADED = "uploaded",
	FAILED = "failed",
}

/**
 * Interface representing a document in the file management system.
 */
export interface fmDocuments {
	storage_url: string;
	mimetype: string;
	type: string | null;
	__typename: string;
}

/**
 * Represents the statistics of project documents.
 */
export interface ProjectDocumentStats {
	/**
	 * Contains information about the documents.
	 */
	documents: {
		/**
		 * The unique identifier of the document.
		 */
		id: string;

		/**
		 * An array of financial documents.
		 */
		financial_documents: fmDocuments[];

		/**
		 * The GraphQL type name.
		 */
		__typename: string;
	};

	/**
	 * Indicates whether the document is valid.
	 */
	isValidDoc: boolean;
}

/**
 * Represents metadata information about a file.
 *
 * @interface FileMetadata
 * @property {string} name - The name of the file.
 * @property {number} size - The size of the file in bytes.
 * @property {number} lastModified - The last modified timestamp of the file.
 * @property {string} type - The MIME type of the file.
 */
export interface FileMetadata {
	name: string;
	size: number;
	lastModified: number;
	type: string;
}

export interface UploadError {
	message: string;
	failedFiles: FileMetadata | null;
	status: "upload_failed" | "processing_failed" | "type_failed";
}
