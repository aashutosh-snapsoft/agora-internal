import { Document } from "./documents";
import { FinancialModelComponentType, FMComponent } from "./fm-component";
import { User } from "./user";

export type ProjectWithFMComponents = Project & {
	// The latest income statement financial model of the component
	income_statement?: FMComponent | null;
	balance_sheet?: FMComponent | null;
	cashflow_statement?: FMComponent | null;
};

export type Project = {
	id?: string;

	author_id?: string;
	author?: User;

	data?: ProjectData;
	metadata?: ProjectMetadata;
	name?: string;
	fm_components?: FMComponent[];
	documents?: Document[];

	description?: string;
	created_at?: string;
	updated_at?: string;
	deleted_at?: string;
	created?: string;
	updated?: string;
	deleted?: string;
	project_states?: ProjectState[];
};

export function selectFMComponent(
	project: ProjectWithFMComponents,
	componentType: FinancialModelComponentType
) {
	switch (componentType) {
		case "income-statement":
			return project.income_statement;
		case "balance-sheet":
			return project.balance_sheet;
		case "cashflow-statement":
			return project.cashflow_statement;
		default:
			return null;
	}
}

export type ProjectData = {
	project_type?: string;
	/**
	 * Boolean flag to indicate whether the project is private or public.
	 */
	is_private?: boolean;

	/**
	 * The business sector of the project. e.g. "Information Technology"
	 */
	business_sector?: string;
	/**
	 * The revenue model of the project. e.g. ["SaaS", "Subscription"]
	 */
	revenue_model?: string[];
	/**
	 * The location of the company. e.g. "New York"
	 */
	company_location?: string;
	rounding?: string;
	currency?: string;
	decimal_places_shown?: number | string;
	fiscal_year_end?: string;
	accounting_basics?: string;
};

export type ProjectMetadata = {
	enable_forecast?: boolean;
	project_status?: ProjectListStatus;
	exported_to_excel_at?: string | null;
	completed_project_state_id?: string | null;
};

export type ProjectListStatus =
	| "processing"
	| "needs_review"
	| "completed";

export type ProjectState = {
	id: string;
	state:
		| "empty"
		| "uploaded"
		| "document_processing"
		| "invalid"
		| "ingesting"
		| "ingested"
		| "ingestion_complete"
		| "calculated"
		| "calculating"
		| "forecasted"
		| "forecasting"
		| "derived";
	data: any;
	created_at: string;
};
