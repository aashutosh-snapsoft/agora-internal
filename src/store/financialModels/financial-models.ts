import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Build } from "@/types/content";
import { TaxonomyConcept } from "@/types/content";
import { FMComponent } from "@/types/fm-component";
import { FinancialModelComponentType } from "@/types/fm-component";

type FMComponentSet = {
	all: FMComponent[];
	income_statement: FMComponent;
	balance_sheet: FMComponent;
	cashflow_statement: FMComponent;
};

interface ClassificationStatistics {
	unclassified: number;
	low: number;
	medium: number;
	high: number;
	hidden: number;
}

interface FMState {
	/**
	 * The `fmComponents` state provides an object that holds on to the
	 * full list of financial model components available on a selected project.
	 * The selected project can be found under the `project` redux global state.
	 *
	 * The `fmComponents` object contains the following properties:
	 * 1. `all`: an array of all financial model components available on the project.
	 * 2. `income_statement`: the latest income statement financial model component.
	 * 3. `balance_sheet`: the latest balance sheet financial model component.
	 * 4. `cashflow_statement`: the latest cash flow statement financial model component.
	 */
	fmComponents: FMComponentSet | null;

	/**
	 * The `classificationStatistics` state provides an object that holds on to the
	 * classification statistics for a given project.
	 *
	 * The keys of the object are the type of financial model component and
	 * the value is an object with the following properties:
	 */
	classificationStatistics: {
		incomeStatement: ClassificationStatistics;
		balanceSheet: ClassificationStatistics;
		cashflowStatement: ClassificationStatistics;
	};

	/**
	 * The `existingBuilds` state provides an object that holds on to a list of
	 * references (primary key) to existing builds for a given project.
	 *
	 * The keys of the object are the type of financial model component and
	 * the value is an array of build ids.
	 */
	existingBuilds: Record<FinancialModelComponentType, string[]>;

	/**
	 * The current build on the current financial model being viewed.
	 *
	 * The keys of the object are the type of financial model component and
	 * the value is the build object.
	 */
	currentBuilds: Record<FinancialModelComponentType, Build | null>;
	/**
	 * The list of taxonomy concepts available on the platform.
	 *
	 * Currently this is a list of taxonomy concepts which are fixed and do not change.
	 */
	taxonomyConcepts: TaxonomyConcept[] | null;
	/**
	 * Indicates if the financial model is loading.
	 */
	loading: boolean;
	/**
	 * The error message if the financial model fails to load.
	 */
	error: string | null;
}

const initialState: FMState = {
	fmComponents: null,
	classificationStatistics: {
		incomeStatement: {
			unclassified: 0,
			low: 0,
			medium: 0,
			high: 0,
			hidden: 0,
		},
		balanceSheet: {
			unclassified: 0,
			low: 0,
			medium: 0,
			high: 0,
			hidden: 0,
		},
		cashflowStatement: {
			unclassified: 0,
			low: 0,
			medium: 0,
			high: 0,
			hidden: 0,
		},
	},
	existingBuilds: {
		"income-statement": [],
		"balance-sheet": [],
		"cashflow-statement": [],
	},
	currentBuilds: {
		"income-statement": null,
		"balance-sheet": null,
		"cashflow-statement": null,
	},
	taxonomyConcepts: null,
	loading: false,
	error: null,
};

const fmSlice = createSlice({
	name: "fm",
	initialState,
	reducers: {
		setClassificationStatistics: (
			state,
			action: PayloadAction<{
				incomeStatement: ClassificationStatistics;
				balanceSheet: ClassificationStatistics;
				cashflowStatement: ClassificationStatistics;
			}>
		) => {
			state.classificationStatistics = action.payload;
		},
	},
});

export default fmSlice.reducer;

export const { setClassificationStatistics } = fmSlice.actions;
