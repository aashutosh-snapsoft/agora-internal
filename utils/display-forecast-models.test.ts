import {
	Context,
	ForecastDriver,
	ForecastInputs,
	LineItem,
} from "@/types/content";
import {
	displayForecastDriverAndInputs,
	determineForecastLabel,
} from "./display-forecast-models";
describe("displayForecastDriverAndInputs", () => {
	it("should return 'None' when driver or inputs are null", () => {
		expect(displayForecastDriverAndInputs(null, null)).toBe("None");
		expect(
			displayForecastDriverAndInputs(
				{ driver: "historical_cagr", source: "user" },
				null
			)
		).toBe("None");
		expect(
			displayForecastDriverAndInputs(null, {
				driver_input_period: "all_reported_periods",
				rate: 0,
			})
		).toBe("None");
	});

	it("should display driver and input period correctly", () => {
		const driver: ForecastDriver = {
			driver: "historical_cagr",
			source: "user",
		};
		const inputs: ForecastInputs = {
			driver_input_period: "all_reported_periods",
			rate: 0,
		};

		expect(displayForecastDriverAndInputs(driver, inputs)).toBe(
			"historical_cagr (all_reported_periods)"
		);
	});
});

describe("determineForecastLabel", () => {
	// Helper function to create a basic line item for testing
	const createLineItem = (overrides = {}): LineItem => ({
		id: "1",
		context_id: "context-1",
		fact_value: {
			value: [100, 200, 300],
			type: "numeric",
			raw_name: "Test Item",
			confidence: 1.0,
			category: "P003: Keyword based classification",
			classification: "revenues",
			is_summary_rollup: false,
			is_abstract: false,
			is_total: false,
		},
		taxonomy_concept_id: "taxonomy-1",
		taxonomy_concept: {
			id: "taxonomy-1",
			namespace: "test",
			name: "test-tag",
			formula: "test",
			type: "reported",
			presentation_linkbase: null,
			taxonomy_labels: [],
			template_concepts: [],
		},
		forecast_drivers: null,
		forecast_inputs: null,
		state: "pending",
		unit: "primary_currency",
		periods: [],
		...overrides,
	});

	const context: Context = {
		id: "context-1",
		created_at: new Date().toISOString(),
		author_id: "author-1",
		name: "Test Context",
		parent_context_id: null,
		periods: [],
		line_items: [],
		forecast_settings: {
			line_items: [],
		},
		component_settings: {},
	};

	it("should return 'Assumption Needed' for user_assumption_required driver", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "user_assumption_required", source: "user" },
			forecast_inputs: { driver_input_period: "all_reported_periods", rate: 0 },
		});

		expect(determineForecastLabel(context, lineItem)).toBe("Assumption Needed");
	});

	it("should return 'Assumption Needed' for user_assumption_required driver regardless of values", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "user_assumption_required", source: "user" },
			forecast_inputs: {
				driver_input_period: "all_reported_periods",
				rate: 0,
				values: [
					{ period_id: "1", value: 100 },
					{ period_id: "2", value: 200 },
				],
			},
		});

		expect(determineForecastLabel(context, lineItem)).toBe("Assumption Needed");
	});

	it("should return 'Set to Zero' for set_to_zero driver", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "set_to_zero", source: "user" },
			forecast_inputs: {
				driver_input_period: "all_reported_periods",
				rate: 0,
			},
		});

		expect(determineForecastLabel(context, lineItem)).toBe("Set to Zero");
	});

	it("should return 'Constant' for constant_percent driver with user source", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "constant_percent", source: "user" },
			forecast_inputs: {
				driver_input_period: "final_reported_period",
				rate: 0.05,
			},
		});

		expect(determineForecastLabel(context, lineItem)).toBe(
			"Constant"
		);
	});

	it("should return 'Constant : All Reported Periods' for constant_percent driver with calculated source", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "constant_percent", source: "calculated" },
			forecast_inputs: {
				driver_input_period: "all_reported_periods",
				rate: 0.05,
			},
		});

		expect(determineForecastLabel(context, lineItem)).toBe(
			"Constant : All Reported Periods"
		);
	});

	it("should return 'Constant : Last Reported Period' for constant_percent driver with calculated source and final_reported_period", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "constant_percent", source: "calculated" },
			forecast_inputs: {
				driver_input_period: "final_reported_period",
				rate: 0.05,
			},
		});

		expect(determineForecastLabel(context, lineItem)).toBe(
			"Constant : Last Reported Period"
		);
	});

	it("should return 'Assumption Needed' for required assumptions without values", () => {
		const lineItem = createLineItem({
			taxonomy_concept: {
				id: "taxonomy-1",
				namespace: "test",
				name: "interest-expense",
				formula: "test",
				type: "reported",
				presentation_linkbase: null,
				taxonomy_labels: [],
				template_concepts: [],
			},
			forecast_drivers: null,
			forecast_inputs: {
				driver_input_period: "all_reported_periods",
				rate: 0,
				values: [],
			},
		});

		expect(determineForecastLabel(context, lineItem)).toBe("Assumption Needed");
	});

	it("should return 'User Assumption' for constant_amount drivers", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "constant_amount", source: "user" },
			forecast_inputs: { driver_input_period: "all_reported_periods", rate: 0 },
		});

		expect(determineForecastLabel(context, lineItem)).toBe("User Assumption");
	});

	it("should return 'Calculated' for derived taxonomy concepts without forecast drivers", () => {
		const lineItem = createLineItem({
			taxonomy_concept: {
				id: "taxonomy-1",
				namespace: "test",
				name: "test-tag",
				formula: "test",
				type: "derived",
				presentation_linkbase: null,
				taxonomy_labels: [],
				template_concepts: [],
			},
			forecast_drivers: null,
			forecast_inputs: null,
		});

		expect(determineForecastLabel(context, lineItem)).toBe("Calculated");
	});

	it("should return 'None' for non-derived taxonomy concepts without forecast drivers", () => {
		const lineItem = createLineItem({
			forecast_drivers: null,
			forecast_inputs: null,
		});

		expect(determineForecastLabel(context, lineItem)).toBe("None");
	});

	it("should handle 'historical_cagr' driver with different period ranges", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "historical_cagr", source: "user" },
			forecast_inputs: { driver_input_period: "all_reported_periods", rate: 0 },
		});
		expect(determineForecastLabel(context, lineItem)).toBe(
			"CAGR : All Reported Periods"
		);

		const lineItem2 = createLineItem({
			forecast_drivers: { driver: "historical_cagr", source: "user" },
			forecast_inputs: {
				driver_input_period: "final_reported_period",
				rate: 0,
			},
		});
		expect(determineForecastLabel(context, lineItem2)).toBe(
			"CAGR : Last Reported Period"
		);

		const lineItem3 = createLineItem({
			forecast_drivers: { driver: "historical_cagr", source: "user" },
			forecast_inputs: { driver_input_period: "final_reported_period", rate: 0 },
		});
		expect(determineForecastLabel(context, lineItem3)).toBe(
			"CAGR : Last Reported Period"
		);
	});

	it("should handle 'percent_of_line_item' driver with revenues", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "percent_of_line_item", source: "user" },
			forecast_inputs: {
				driver_input_period: "all_reported_periods",
				rate: 0,
				line_item_tag: "revenues",
			},
		});

		expect(determineForecastLabel(context, lineItem)).toBe(
			"% of Revenue : All Reported Periods"
		);
	});

	it("should handle 'percent_of_line_item' driver with other line items", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "percent_of_line_item", source: "user" },
			forecast_inputs: {
				driver_input_period: "all_reported_periods",
				rate: 0,
				line_item_tag: "cost-of-revenue",
			},
		});

		expect(determineForecastLabel(context, lineItem)).toBe(
			"% of Cost of Revenue : All Reported Periods"
		);
	});

	it("should handle 'fixed_amount_percent' driver", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "fixed_amount_percent", source: "user" },
			forecast_inputs: { driver_input_period: "all_reported_periods", rate: 0 },
		});

		expect(determineForecastLabel(context, lineItem)).toBe(
			"Fixed Amount Increase (%)"
		);
	});

	it("should handle 'fixed_amount_quantity' driver", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "fixed_amount_quantity", source: "user" },
			forecast_inputs: { driver_input_period: "all_reported_periods", rate: 0 },
		});

		expect(determineForecastLabel(context, lineItem)).toBe(
			"Fixed Amount Increase ($)"
		);
	});

	it("should handle 'days_outstanding' driver with different line items", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "days_outstanding", source: "user" },
			forecast_inputs: {
				driver_input_period: "all_reported_periods",
				rate: 0,
				line_item_tag: "days-sales-outstanding",
			},
		});
		expect(determineForecastLabel(context, lineItem)).toBe(
			"Days Sales Outstanding"
		);

		const lineItem2 = createLineItem({
			forecast_drivers: { driver: "days_outstanding", source: "user" },
			forecast_inputs: {
				driver_input_period: "all_reported_periods",
				rate: 0,
				line_item_tag: "days-payable-outstanding",
			},
		});
		expect(determineForecastLabel(context, lineItem2)).toBe(
			"Days Payable Outstanding"
		);

		const lineItem3 = createLineItem({
			forecast_drivers: { driver: "days_outstanding", source: "user" },
			forecast_inputs: {
				driver_input_period: "all_reported_periods",
				rate: 0,
				line_item_tag: "days-inventory-outstanding",
			},
		});
		expect(determineForecastLabel(context, lineItem3)).toBe(
			"Days Inventory Outstanding"
		);
	});

	it("should return '?' for unknown driver types", () => {
		const lineItem = createLineItem({
			forecast_drivers: { driver: "unknown_driver" as any, source: "user" },
			forecast_inputs: { driver_input_period: "all_reported_periods", rate: 0 },
		});

		expect(determineForecastLabel(context, lineItem)).toBe("?");
	});
});
