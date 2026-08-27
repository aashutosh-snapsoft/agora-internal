import { RootState } from "../store";

export const fmSelector = (state: RootState) => {
	return state.financial_modeling;
};

export const selectTaxonomyConcepts = (state: RootState) =>
	state.financial_modeling.taxonomyConcepts;
