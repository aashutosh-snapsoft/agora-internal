export type DocumentType =
	| "pdf"
	| "excel"
	| "financial_statement"
	| "contract"
	| "legal_document"
	| "others";
export type DocumentSource = "storage_url";

export interface Document {
	id: string;
	type: DocumentType;
	source: DocumentSource;
	state: string;
	details: string;
	filename: string;
	created_at: string;
	storage_url: string;
	mimetype: string;
	metadata: {
		validation: Array<{
			title: string;
			status: "pass" | "fail";
			details: string;
		}>;
	};
	updated_at: string;
	fileType?: string;
	__typename: string;
}
