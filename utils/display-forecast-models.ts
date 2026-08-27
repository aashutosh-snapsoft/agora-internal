export const requiredAssumptions = [
	"depreciation-and-amortization-expense",
	"interest-expense",
	"interest-and-investment-income",
	"income-tax-expense",
	"preferred-dividends-and-other-adjustments-to-net-income",
	"property-plant-and-equipment-gross",
	"accumulated-depreciation",
	"short-term-debt",
	"long-term-debt",
];

const taxonomyConceptToLabel = (concept: string): string => {
	switch (concept) {
		case "depreciation-and-amortization-expense": return "Depreciation and Amortization Expense";
		case "interest-expense": return "Interest Expense";
		case "interest-and-investment-income": return "Interest and Investment Income";
		case "income-tax-expense": return "Income Tax Expense";
		case "effective-tax-rate": return "Effective Tax Rate";
		case "interest-rate": return "Interest Rate";
		case "preferred-dividends-and-other-adjustments-to-net-income": return "Preferred Dividends & Other Adjustments to Net Income";
		case "property-plant-and-equipment-gross": return "Gross Property, Plant, & Equipment";
		case "accumulated-depreciation": return "Accumulated Depreciation";
		case "short-term-debt": return "Short-Term Debt";
		case "long-term-debt": return "Long-Term Debt";
		case "cost-of-revenue": return "Cost of Revenue";
		case "selling-general-and-administrative-expenses": return "Selling, General, & Administrative Expenses";
		case "research-and-development-expenses": return "Research and Development Expenses";
		case "ebt-loss-including-unusual-items": return "EBT Loss Including Unusual Items";
		case "ebt-loss-excluding-unusual-items": return "EBT Loss Excluding Unusual Items";
		default: return concept;
	}
};
import {
	Context,
	ForecastDriver,
	ForecastInputs,
	LineItem,
} from "@/types/content";

/**
 * The available states for a forecast driver cell.
 * - calculated: The value is derived from a formula or calculation
 * - driver: The value is configured with a forecast driver
 * - assumption-needed: The value requires a user assumption
 */
export type ForecastDriverState = "calculated" | "driver" | "assumption-needed";

/**
 * Represents pending changes to forecast drivers stored in Redux
 */
export type ForecastDriverPendingChanges = {
	[taxonomyConceptName: string]: {
		forecast_drivers: ForecastDriver;
		forecast_inputs: ForecastInputs;
		isPending: boolean;
	};
};

/**
 * LineItem.forecast_drivers: Represents the historical configuration that was used to calculate the line item's values.
 * This property shows how values were actually calculated in the past.
 *
 * Context.forecast_settings.line_items[].forecast_drivers: Represents the current settings for future calculations.
 * These settings represent the inter-build state that will be used for the next calculation.
 *
 * When determining the state or label to display, the Context version should take precedence
 * when available, with the LineItem version serving as a fallback.
 */

/**
 * LineItem.forecast_inputs: Contains the actual inputs used historically in calculations.
 * These inputs were used to produce the current numerical values in the model.
 *
 * Context.forecast_settings.line_items[].forecast_inputs: Contains the current input settings
 * to be used in future calculations. These may differ from what was historically applied.
 *
 * Like with forecast drivers, the Context version should be prioritized when available.
 */

export function displayForecastDriverAndInputs(
	driver: ForecastDriver | null,
	inputs: ForecastInputs | null
) {
	if (!driver || !inputs) {
		return "None";
	}
	return `${driver.driver} (${inputs.driver_input_period})`;
}

/**
 * Determines the state of a forecast driver cell for display and interaction.
 *
 * @param lineItem - The line item being evaluated
 * @param forecastDriverOverride - Optional override for the forecast driver (e.g., "CASHFLOW")
 * @param context - Optional context that may contain override forecast settings for this line item
 * @param pendingChanges - Optional pending changes from Redux store
 * @returns The appropriate state for the forecast driver cell
 *
 * When context is provided, the function first checks if there's a matching line item
 * in context.forecast_settings.line_items by taxonomy concept name.
 * If found, the context's forecast drivers and inputs take precedence over the line item's.
 */
export function determineForecastDriverState(
	lineItem: LineItem,
	forecastDriverOverride?: string,
	context?: Context,
	pendingChanges?: ForecastDriverPendingChanges
): ForecastDriverState {
	if (!lineItem || !lineItem.taxonomy_concept) {
		return "driver";
	}

	const taxonomyConcept = lineItem.taxonomy_concept;
	const tag = taxonomyConcept.name;

	// Cash equivalents special case
	if (tag === "cash-and-cash-equivalents-at-carrying-value") {
		return "calculated";
	}

	// NEW: First check pending changes from Redux
	const pendingChange = pendingChanges?.[tag];

	// If context is provided, use it to potentially override the forecast drivers and inputs
	const forecastSettingLineItem = context?.forecast_settings?.line_items?.find(
		(li) => li.taxonomy_concept?.name === tag
	);

	// Apply prioritization: (a) Redux pending → (b) Context → (c) LineItem
	const forecastDriver =
		pendingChange?.forecast_drivers ??
		forecastSettingLineItem?.forecast_drivers ??
		lineItem.forecast_drivers;

	const forecastInputs =
		pendingChange?.forecast_inputs ??
		forecastSettingLineItem?.forecast_inputs ??
		lineItem.forecast_inputs;

	// Determine if the item is calculated based on taxonomy concept
	let isCalculated = taxonomyConcept.type === "derived";

	// Check for user_assumption_required driver
	if (forecastDriver && forecastDriver.driver === "user_assumption_required") {
		return "assumption-needed";
	}

	// For dynamic type, check forecasted metadata
	if (taxonomyConcept.type === "dynamic") {
		if (taxonomyConcept.metadata?.type?.forecasted === "derived") {
			return "calculated";
		} else {
			isCalculated = false;
		}
	}

	// Check for CASHFLOW override
	if (forecastDriverOverride === "CASHFLOW") {
		isCalculated = true;
	}

	// Handle required assumptions (legacy logic kept for backward compatibility)
	if (requiredAssumptions.includes(tag)) {
		const hasNonConstantForecastSettings =
			forecastInputs &&
			forecastDriver &&
			forecastDriver.driver !== "constant_amount";

		if (hasNonConstantForecastSettings) {
			return "driver";
		} else {
			if (forecastDriver?.driver === "constant_amount") {
				const values =
					forecastInputs?.values?.map((input) => (input.value ?? 0) === 0) ??
					[];
				const isAllZero = values.every((value) => value === true);
				const hasConstantAssumption = values.length > 0;

				if (!hasConstantAssumption || isAllZero) {
					return "assumption-needed";
				} else {
					return "driver";
				}
			}
		}
	}

	// Default state based on calculated flag
	return isCalculated ? "calculated" : "driver";
}

/**
 * Determine the forecast label for a line item.
 *
 * @param context Context containing forecast settings that may override the line item's settings
 * @param lineItem The line item to determine the forecast label for
 * @param pendingChanges Optional pending changes from Redux store
 * @returns A formatted string representing the forecast methodology
 *
 * Similar to determineForecastDriverState, this function prioritizes:
 * - (a) Redux pending changes
 * - (b) Context forecast settings
 * - (c) LineItem settings
 */
type ForecastLabelContextArg = Context | LineItem | null | undefined;
type ForecastLabelLineItemArg = LineItem | Context | null | undefined;

export function determineForecastLabel(
	contextOrLineItem: ForecastLabelContextArg,
	lineItemOrContext: ForecastLabelLineItemArg,
	pendingChanges?: ForecastDriverPendingChanges
): string {
	// Backward/defensive argument normalization:
	// - Some callers historically passed (lineItem, context)
	// - Others pass (context, lineItem)
	// Normalize to avoid returning "None" when args are swapped.
	let context: Context | undefined;
	let lineItem: LineItem | undefined;

	if (contextOrLineItem && "taxonomy_concept" in contextOrLineItem) {
		lineItem = contextOrLineItem as LineItem;
		if (lineItemOrContext && "forecast_settings" in lineItemOrContext) {
			context = lineItemOrContext as Context;
		}
	} else {
		context = contextOrLineItem as Context | undefined;
		if (lineItemOrContext && "taxonomy_concept" in lineItemOrContext) {
			lineItem = lineItemOrContext as LineItem;
		}
	}

	if (!lineItem?.taxonomy_concept) {
		return "None";
	}

	const taxonomyConcept = lineItem.taxonomy_concept;
	const tag = taxonomyConcept.name;

	// NEW: First check pending changes from Redux
	const pendingChange = pendingChanges?.[tag];

	const forecastSettingLineItem = context?.forecast_settings?.line_items?.find(
		(li) => li.taxonomy_concept?.name === tag
	);

	// Apply prioritization: (a) Redux pending → (b) Context → (c) LineItem
	const forecastDrivers =
		pendingChange?.forecast_drivers ??
		forecastSettingLineItem?.forecast_drivers ??
		lineItem?.forecast_drivers;

	const forecastInputs =
		pendingChange?.forecast_inputs ??
		forecastSettingLineItem?.forecast_inputs ??
		lineItem?.forecast_inputs;

	// Determine period range label for display
	let periodRangeLabel = "All Reported Periods";
	if (forecastInputs?.driver_input_period === "final_reported_period") {
		periodRangeLabel = "Last Reported Period";
	} else if (forecastInputs?.driver_input_period === "constant_schedule") {
		periodRangeLabel = "Custom Schedule";
	}

	// Check for user_assumption_required driver
	if (
		forecastDrivers &&
		forecastDrivers.driver === "user_assumption_required"
	) {
		return `Assumption Needed`;
	}

	// Check for set_to_zero driver
	if (forecastDrivers && forecastDrivers.driver === "set_to_zero") {
		return `Set to Zero`;
	}

	// Check for constant_percent driver
	if (forecastDrivers && forecastDrivers.driver === "constant_percent") {
		if (forecastDrivers.source === "calculated") {
			return `Constant : ${periodRangeLabel}`;
		} else {
			return `Constant`;
		}
	}

	const requiresUserAssumption = requiredAssumptions.includes(tag);
	const hasAssumption =
		forecastInputs && forecastInputs.values && forecastInputs.values.length > 0;

	const hasNonConstantForecastSettings =
		forecastInputs &&
		forecastDrivers &&
		!(
			forecastDrivers.driver === "constant_amount" &&
			forecastDrivers.source === "user" &&
			forecastInputs.driver_input_period === null &&
			forecastInputs.rate === 0 &&
			(!forecastInputs.values ||
				forecastInputs.values.every((v) => v.value === 0))
		);

	if (
		requiresUserAssumption &&
		!hasAssumption &&
		!hasNonConstantForecastSettings
	) {
		return `Assumption Needed`;
	}

	if (forecastDrivers && forecastDrivers.driver === "constant_amount") {
		return `User Assumption`;
	}

	if (!forecastDrivers || !forecastInputs) {
		if (
			taxonomyConcept.type === "derived" ||
			taxonomyConcept.type === "dynamic"
		) {
			return "Calculated";
		}
		return "None";
	}

	// periodRangeLabel is already declared above

	if (forecastDrivers.driver === "historical_cagr") {
		return `CAGR : ${periodRangeLabel}`;
	}

	if (forecastDrivers.driver === "percent_of_line_item") {
		const lineItemTag = forecastInputs.line_item_tag!;
		
		// Handle specific cases first
		let label: string;
		switch (lineItemTag) {
			case "revenues": {
				label = "Revenue";
				break;
			}
			case "cost-of-revenue": {
				label = "Cost of Revenue";
				break;
			}
			default: {
				// Try the taxonomy function first
				const taxonomyLabel =
					typeof taxonomyConceptToLabel === "function"
						? taxonomyConceptToLabel(lineItemTag)
						: lineItemTag;
				if (taxonomyLabel !== lineItemTag) {
					// taxonomyConceptToLabel found a match
					label = taxonomyLabel;
				} else {
					// Convert hyphenated names to readable format
					label = typeof lineItemTag === "string"
						? lineItemTag
							.split('-')
							.map(word => word.charAt(0).toUpperCase() + word.slice(1))
							.join(' ')
						: "";
				}
			}
		}
		return `% of ${label} : ${periodRangeLabel}`;
	}

	if (forecastDrivers.driver === "fixed_amount_percent") {
		return `Fixed Amount Increase (%)`;
	}

	if (forecastDrivers.driver === "fixed_amount_quantity") {
		return `Fixed Amount Increase ($)`;
	}

	if (forecastDrivers.driver === "days_outstanding") {
		switch (forecastInputs.line_item_tag) {
			case "days-sales-outstanding":
				return `Days Sales Outstanding`;
			case "days-payable-outstanding":
				return `Days Payable Outstanding`;
			case "days-inventory-outstanding":
				return `Days Inventory Outstanding`;
		}
	}

	return `?`;
}
