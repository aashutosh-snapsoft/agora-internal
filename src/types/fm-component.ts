import { Build } from "./content";

/**
 * This type represents the different types of financial model components
 * that can be used in a project.
 *
 * The following types are supported:
 * 1. income-statement: Income Statement
 * 2. cashflow-statement: Cash Flow Statement
 * 3. balance-sheet: Balance Sheet
 */
export type FinancialModelComponentType =
	| "income-statement"
	| "cashflow-statement"
	| "balance-sheet";

/**
 * This type represents a financial model component.
 */
export type FMComponent = {
	id: string;
	name: string;
	type: FinancialModelComponentType;
	active_build_id: string;
	author_id: string;
	model_template_id: string;
	builds: Build[];
};
