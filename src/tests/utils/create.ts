import {
	ForecastDriver,
	ForecastInputs,
	LineItem,
	Period,
	TaxonomyConcept,
} from "@/types/content";

export const createLineItem: (
	tag: string,
	name: string,
	partials?: {
		forecast_drivers?: ForecastDriver;
		forecast_inputs?: ForecastInputs;
	}
) => LineItem = (tag, name, partials) => ({
	id: "1",
	fact_value: {
		value: [100],
		type: "numeric",
		raw_name: name,
		confidence: 1,
		category: "P003",
		classification: tag,
		is_summary_rollup: false,
		is_abstract: false,
		is_total: false,
	},
	periods: [],
	model_template_id: "",
	state: "pending",
	context_id: "1",
	unit: "primary_currency",
	forecast_drivers: partials?.forecast_drivers ?? null,
	forecast_inputs: partials?.forecast_inputs ?? null,
	taxonomy_concept_id: "1",
	taxonomy_concept: createTaxonomyConcept(tag, name),
});

export const createTaxonomyConcept: (
	tag: string,
	name: string
) => TaxonomyConcept = (tag, name) => ({
	id: "1",
	namespace: "https://taxonomia.socratics.ai/financials/v1",
	name: tag,
	formula: "",
	type: "reported",
	presentation_linkbase: null,
	template_concepts: [],
	taxonomy_labels: [
		{
			label: name,
			label_language: "en",
			language_code: "en",
		},
	],
});

export const createTimePeriod: (
	id: string,
	startDate: string,
	endDate: string | null,
	type: "duration" | "instant",
	entry_type: "reported" | "forecasted" | "blended"
) => Period = (id, startDate, endDate, type, entry_type) => ({
	id,
	type,
	start_date: startDate,
	end_date: endDate,
	entry_type,
	is_visible: true,
	state: {
		allow_calculations: true,
	},
});
