import { describe, test, expect, beforeEach } from "@jest/globals";
import { determineForecastDriverState } from "./display-forecast-models";
import { Context, LineItem, TaxonomyConcept } from "@/types/content";

describe("determineForecastDriverState", () => {
	let mockLineItem: Partial<LineItem>;
	let mockContext: Partial<Context>;

	beforeEach(() => {
		// Basic line item setup
		mockLineItem = {
			id: "test-id",
			taxonomy_concept: {
				id: "concept-id",
				name: "test-tag",
				type: "reported",
				formula: "",
				metadata: { type: { forecasted: "reported" } },
			} as Partial<TaxonomyConcept> as TaxonomyConcept,
			forecast_drivers: {
				driver: "constant_amount",
				source: "user",
			},
			forecast_inputs: {
				driver_input_period: undefined,
				rate: 0,
				values: [],
				line_item_tag: undefined,
			},
		};

		// Basic context setup
		mockContext = {
			id: "context-id",
			forecast_settings: {
				line_items: [],
			},
		};
	});

	test("returns 'driver' for undefined or null line item", () => {
		expect(determineForecastDriverState(null as unknown as LineItem)).toBe(
			"driver"
		);
		expect(determineForecastDriverState(undefined as unknown as LineItem)).toBe(
			"driver"
		);
	});

	test("returns 'calculated' for cash-and-cash-equivalents special case", () => {
		if (mockLineItem.taxonomy_concept) {
			mockLineItem.taxonomy_concept.name =
				"cash-and-cash-equivalents-at-carrying-value";
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"calculated"
		);
	});

	test("returns 'calculated' when taxonomy concept type is derived", () => {
		if (mockLineItem.taxonomy_concept) {
			mockLineItem.taxonomy_concept.type = "derived";
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"calculated"
		);
	});

	test("returns 'calculated' when dynamic taxonomy has forecasted type of derived", () => {
		if (mockLineItem.taxonomy_concept) {
			mockLineItem.taxonomy_concept.type = "dynamic";
			mockLineItem.taxonomy_concept.metadata = {
				type: { forecasted: "derived" },
			};
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"calculated"
		);
	});

	test("returns 'calculated' when forecastDriverOverride is CASHFLOW", () => {
		expect(
			determineForecastDriverState(mockLineItem as LineItem, "CASHFLOW")
		).toBe("calculated");
	});

	test("returns 'assumption-needed' for user_assumption_required driver", () => {
		if (mockLineItem.taxonomy_concept && mockLineItem.forecast_drivers) {
			mockLineItem.taxonomy_concept.name = "test-tag";
			mockLineItem.forecast_drivers.driver = "user_assumption_required";
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"assumption-needed"
		);
	});

	test("returns 'assumption-needed' for user_assumption_required driver regardless of values", () => {
		if (
			mockLineItem.taxonomy_concept &&
			mockLineItem.forecast_drivers &&
			mockLineItem.forecast_inputs
		) {
			mockLineItem.taxonomy_concept.name = "test-tag";
			mockLineItem.forecast_drivers.driver = "user_assumption_required";
			mockLineItem.forecast_inputs.values = [
				{ period_id: "1", value: 100 },
				{ period_id: "2", value: 200 },
			];
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"assumption-needed"
		);
	});

	test("returns 'driver' for set_to_zero driver", () => {
		if (mockLineItem.taxonomy_concept && mockLineItem.forecast_drivers) {
			mockLineItem.taxonomy_concept.name = "test-tag";
			mockLineItem.forecast_drivers.driver = "set_to_zero";
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"driver"
		);
	});

	test("returns 'driver' for constant_percent driver", () => {
		if (mockLineItem.taxonomy_concept && mockLineItem.forecast_drivers) {
			mockLineItem.taxonomy_concept.name = "test-tag";
			mockLineItem.forecast_drivers.driver = "constant_percent";
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"driver"
		);
	});

	test("returns 'assumption-needed' for required assumption with no values", () => {
		if (
			mockLineItem.taxonomy_concept &&
			mockLineItem.forecast_drivers &&
			mockLineItem.forecast_inputs
		) {
			mockLineItem.taxonomy_concept.name = "interest-expense";
			mockLineItem.forecast_drivers.driver = "constant_amount";
			mockLineItem.forecast_inputs.values = [];
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"assumption-needed"
		);
	});

	test("returns 'assumption-needed' for required assumption with all zero values", () => {
		if (
			mockLineItem.taxonomy_concept &&
			mockLineItem.forecast_drivers &&
			mockLineItem.forecast_inputs
		) {
			mockLineItem.taxonomy_concept.name = "interest-expense";
			mockLineItem.forecast_drivers.driver = "constant_amount";
			mockLineItem.forecast_inputs.values = [
				{ period_id: "1", value: 0 },
				{ period_id: "2", value: 0 },
			];
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"assumption-needed"
		);
	});

	test("returns 'driver' for required assumption with non-zero values", () => {
		if (
			mockLineItem.taxonomy_concept &&
			mockLineItem.forecast_drivers &&
			mockLineItem.forecast_inputs
		) {
			mockLineItem.taxonomy_concept.name = "interest-expense";
			mockLineItem.forecast_drivers.driver = "constant_amount";
			mockLineItem.forecast_inputs.values = [
				{ period_id: "1", value: 10 },
				{ period_id: "2", value: 0 },
			];
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"driver"
		);
	});

	test("returns 'driver' for required assumption with non-constant forecast settings", () => {
		if (mockLineItem.taxonomy_concept && mockLineItem.forecast_drivers) {
			mockLineItem.taxonomy_concept.name = "interest-expense";
			mockLineItem.forecast_drivers.driver = "historical_cagr";
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"driver"
		);
	});

	test("returns 'driver' for normal primary line items", () => {
		if (mockLineItem.taxonomy_concept) {
			mockLineItem.taxonomy_concept.type = "reported";
		}
		expect(determineForecastDriverState(mockLineItem as LineItem)).toBe(
			"driver"
		);
	});

	test("uses context's forecast settings when available", () => {
		// Setup: line item with no values (would be "assumption-needed")
		if (
			mockLineItem.taxonomy_concept &&
			mockLineItem.forecast_drivers &&
			mockLineItem.forecast_inputs
		) {
			mockLineItem.taxonomy_concept.name = "interest-expense";
			mockLineItem.forecast_drivers.driver = "constant_amount";
			mockLineItem.forecast_inputs.values = [];
		}

		// But context has non-zero values (should be "driver")
		if (mockContext.forecast_settings) {
			mockContext.forecast_settings.line_items = [
				{
					id: "forecast-setting-id",
					taxonomy_concept: {
						id: "concept-id",
						name: "interest-expense",
					} as Partial<TaxonomyConcept> as TaxonomyConcept,
					forecast_drivers: {
						driver: "constant_amount",
						source: "user",
					},
					forecast_inputs: {
						values: [
							{ period_id: "1", value: 20 },
							{ period_id: "2", value: 30 },
						],
					},
				} as Partial<LineItem> as LineItem,
			];
		}

		expect(
			determineForecastDriverState(
				mockLineItem as LineItem,
				undefined,
				mockContext as Context
			)
		).toBe("driver");
	});

	test("uses context's forecast settings with different driver", () => {
		// Setup: line item with constant_amount driver
		if (mockLineItem.taxonomy_concept && mockLineItem.forecast_drivers) {
			mockLineItem.taxonomy_concept.name = "interest-expense";
			mockLineItem.forecast_drivers.driver = "constant_amount";
		}

		// But context has historical_cagr driver (should be "driver")
		if (mockContext.forecast_settings) {
			mockContext.forecast_settings.line_items = [
				{
					id: "forecast-setting-id",
					taxonomy_concept: {
						id: "concept-id",
						name: "interest-expense",
					} as Partial<TaxonomyConcept> as TaxonomyConcept,
					forecast_drivers: {
						driver: "historical_cagr",
						source: "user",
					},
					forecast_inputs: {
						driver_input_period: "all_reported_periods",
					},
				} as Partial<LineItem> as LineItem,
			];
		}

		expect(
			determineForecastDriverState(
				mockLineItem as LineItem,
				undefined,
				mockContext as Context
			)
		).toBe("driver");
	});

	test("falls back to line item when no matching line item in context", () => {
		// Setup: line item with constant_amount driver and non-zero values
		if (
			mockLineItem.taxonomy_concept &&
			mockLineItem.forecast_drivers &&
			mockLineItem.forecast_inputs
		) {
			mockLineItem.taxonomy_concept.name = "interest-expense";
			mockLineItem.forecast_drivers.driver = "constant_amount";
			mockLineItem.forecast_inputs.values = [{ period_id: "1", value: 10 }];
		}

		// Context has other line items but not this one
		if (mockContext.forecast_settings) {
			mockContext.forecast_settings.line_items = [
				{
					id: "forecast-setting-id",
					taxonomy_concept: {
						id: "concept-id",
						name: "different-tag",
					} as Partial<TaxonomyConcept> as TaxonomyConcept,
				} as Partial<LineItem> as LineItem,
			];
		}

		expect(
			determineForecastDriverState(
				mockLineItem as LineItem,
				undefined,
				mockContext as Context
			)
		).toBe("driver");
	});
});
