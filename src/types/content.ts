import { Document } from "./documents";
import { FMComponent } from "./fm-component";

/**
 * Represents a financial line item in the system with its historical values and metadata.
 *
 * Important note on forecast properties:
 * - forecast_drivers: Contains the historical configuration that was used to calculate this line item's values
 * - forecast_inputs: Contains the inputs that were historically used in this line item's calculations
 *
 * These properties represent how values were actually calculated in the past. For current/future
 * calculation settings, refer to the matching line item in Context.forecast_settings.line_items.
 */
export type LineItem = {
	id: string;
	fact_value: FactValue;
	taxonomy_concept_id: string | null;
	taxonomy_concept: TaxonomyConcept | null;
	// Structural rows: Header = section header, Total = canonical calculated total,
	// Other = structural subtotal-like row excluded from calculations.
	is_header?: boolean;
	is_total?: boolean;
	is_other?: boolean;
	state: "pending" | "hidden";
	context_id: string;
	row_index?: number | null;
	periods: string[];
	model_template_id?: string;
	unit:
		| "primary_currency"
		| "secondary_currency"
		| "shareholder_common_stock"
		| "ratio"
		| null;
	/**
	 * The forecast driver configuration that was historically used to calculate this line item.
	 * This represents how the line item was calculated, not necessarily how it will be calculated
	 * in the future (which is determined by the Context's forecast_settings).
	 */
	forecast_drivers: ForecastDriver | null;
	/**
	 * The forecast inputs that were historically used in calculations for this line item.
	 * These inputs produced the current numerical values in the model.
	 * For current input settings to be used in future calculations, see the Context.
	 */
	forecast_inputs: ForecastInputs | null;
};

/**
 * Defines how a line item should be forecasted.
 *
 * When part of a LineItem, represents historical calculation methodology.
 * When part of Context.forecast_settings, represents current/future calculation settings.
 *
 * See: https://github.com/SocraticsAI/pythia/blob/dev/src/types/forecasting.ts
 */
export type ForecastDriver = {
	driver:
		| "fixed_amount_percent"
		| "historical_cagr"
		| "link_to_line_item"
		| "fixed_amount_quantity"
		| "percent_of_line_item"
		| "days_outstanding"
		| "accumulated_depreciation"
		| "constant_amount"
		| "user_assumption_required"
		| "set_to_zero"
		| "constant_percent";
	source: "calculated" | "user";
};

/**
 * Contains the inputs for forecasting a line item based on its driver.
 *
 * When part of a LineItem, contains the actual inputs that were used historically.
 * When part of Context.forecast_settings, contains current input settings for future calculations.
 *
 * See: https://github.com/SocraticsAI/pythia/blob/dev/src/types/forecasting.ts
 */
export type ForecastInputs = {
	line_item_id?: string;
	line_item_tag?: string;
	secondary_line_item_tag?: string;
	driver_input_period?:
		| "all_reported_periods"
		| "final_reported_period"
		| "same_period_last_year"
		| "constant_schedule";
	// The rate for the forecast input, if the user has specified a custom value to use.
	// Note that this is only used if the driver is fixed_amount_percent or fixed_amount_quantity or
	// fixed_amount_percent but with source 'calculated'.
	//
	// Example: driver=fixed_amount_quantity, source=calculated, rate=150
	// This means that every time period, a fixed amount of 150 will be added to the line item.
	//
	// Example: driver=fixed_amount_percent, source=calculated, rate=1.50
	// This means that every time period, 150% of the value of the line item will be added to the line item.
	rate: number | null;
	// A list of values for the forecast input, if the user has specified a custom value to use.
	// Note that these are taken as absolute values if and only if the driver is fixed_amount_quantity,
	// but if the driver is fixed_amount_percent, then these values are taken as percentages.
	values?:
		| {
				period_id: string;
				value: number;
		  }[]
		| null;
};

export type TaxonomyConcept = {
	id: string;
	namespace: string;
	name: string;
	formula: string;
	type: "reported" | "derived" | "abstract" | "dynamic";
	presentation_linkbase: PresentationLinkbase | null;
	taxonomy_labels: TaxonomyLabel[];
	template_concepts: TemplateConcept[];
	/** Extended configuration for complex concepts */
	metadata?: {
		/**
		 * System or user-defined default forecast settings
		 * Implementation of this field is currently deferred
		 */
		default_forecast?: { driver: ForecastDriver; inputs: ForecastInputs }[];

		/**
		 * Dynamic type configuration for different time period types
		 * Only used when type='dynamic'
		 */
		type?: {
			/** Type to use for reported/historical periods (typically "reported") */
			reported?: string;

			/** Type to use for forecasted periods (often "assumed") */
			forecasted?: string;
		};

		/**
		 * Dynamic formula configuration for different time period types
		 * Only used when type='dynamic'
		 */
		formula?: {
			/** Formula to use for reported/historical periods (typically "sum") */
			reported?: string;

			/** Formula to use for forecasted periods (often "assumed") */
			forecasted?: string;

			/** Alternative calculation formula that could be used instead of assumptions */
			base?: string;
		};

		/**
		 * When true, UI should provide an option to toggle between using
		 * the forecasted formula (typically assumptions) and the base formula
		 */
		can_switch_to_base_formula?: boolean;

		/**
		 * When true, user input is mandatory for forecasting this concept
		 * Forecasting will only proceed if the line item has an independent forecast driver
		 * (like historical_cagr, fixed_amount_percent, fixed_amount_quantity, or constant_amount)
		 */
		assumption_required?: boolean;
	};
};

export type TemplateConcept = {
	id: string;
	model_template_id: string;
	taxonomy_concept_id: string;
	created_at: string;
};

export type TaxonomyLabel = {
	label: string;
	label_language: string;
	language_code: string;
};

export type PresentationLinkbase = {
	order: number;
	row_style: string;
};

/**
 * A build represents one version of a financial model component.
 *
 * A financial model component can have multiple builds, which allows
 * for different versions of the same model to exist.
 *
 * For example, a financial model component might have a build using
 * conservative assumptions, while another build has a more aggressive assumptions.
 *
 * Builds are major revisions of a financial model component, similar to a
 * Git commit on remote. Contexts on the other hand work similar to Git branches,
 * allowing different users to propose changes to a financial model component
 * before the author of a financial model accepts changes to a build.
 *
 * See: https://app.excalidraw.com/s/4lvlklEGh6T/iPcWY99y5I
 */
export type Build = {
	id: string;
	primary_context: Context;
	fm_component_id?: string;
	fm_component?: FMComponent;
};

/**
 * A context represents a proposed change to a build.
 *
 * Contexts work similar to Git branches, allowing different users to propose
 * changes to a financial model component before the author of a financial
 * model accepts changes to a build.
 *
 * An example of a proposed change to a financial model component is changes to
 * the forecast drivers for a specific line item, as specified under contexts.
 *
 * Note that contexts with NULL author_id represents the core data built by
 * the Socratics platform, while contexts with a specified author_id is content
 * that is proposed by a user.
 *
 * See: https://app.excalidraw.com/s/4lvlklEGh6T/iPcWY99y5I
 */
export type Context = {
	id: string;
	created_at: string;
	author_id: string;
	name: string;
	parent_context_id: string | null;
	/**
	 * Contains the current/future forecast settings for line items in this context.
	 * These settings represent the inter-build state that will be used for the next calculation.
	 *
	 * When displaying or determining line item forecast state, these settings should
	 * take precedence over the historical settings stored directly on the LineItem objects.
	 */
	forecast_settings: ForecastSettings;
	component_settings: ComponentSettings;
	periods: Period[];
	line_items: LineItem[];
};

/**
 * Contains forecast configuration settings for line items in a context.
 * The line_items array contains forecast drivers and inputs that represent
 * the current settings for future calculations, potentially different from
 * what was historically used (stored on LineItem objects).
 */
export type ForecastSettings = {
	line_items: LineItemSubset[];
};

export type ComponentSettings = any;

export type { Document };

/**
 * Represents a time period, which can be an instant or a duration.
 *
 * For example, a period can be a point in time (e.g. 2021-01-01) or a
 * range of time (e.g. 2021-01-01 to 2021-01-31).
 *
 *
 */
export type Period = {
	id: string;
	type: "instant" | "duration";
	// Date values are in UTC (ISO 8601)
	start_date: string;
	// Date values are in UTC (ISO 8601)
	end_date: string | null;
	entry_type: "reported" | "forecasted" | "blended";
	is_visible: boolean;
	state: {
		allow_calculations: boolean;
	};
};

export type BuildContent = {
	line_items: LineItem[];
	periods: Period[];
};

/**
 * A subset of the LineItem type containing only the properties needed for forecast settings.
 * When part of Context.forecast_settings, these line items represent the current/future
 * calculation settings, not the historical ones stored on the full LineItem objects.
 */
export type LineItemSubset = Pick<
	LineItem,
	| "id"
	| "context_id"
	| "forecast_inputs"
	| "forecast_drivers"
	| "taxonomy_concept"
	| "model_template_id"
>;

export type FactValue = {
	type: string;
	value: number[];
	raw_value?: number[];
	raw_name: string;
	confidence: number | null;
	category: string | null;
	classification: string | null;
	is_summary_rollup: boolean;
	is_abstract: boolean;
	is_total: boolean;
	is_other?: boolean;
	is_sign_flipped?: boolean;
	row_index?: number | null;
};

export type Footnote = {
	id: string;
	line_item: LineItem;
	line_item_id: string;
	title: string;
	details: string;
};
