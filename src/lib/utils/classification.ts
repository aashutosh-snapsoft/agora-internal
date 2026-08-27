export const HEADER_CLASSIFICATION_VALUE = "Header";
export const TOTAL_CLASSIFICATION_VALUE = "Total";
export const OTHER_CLASSIFICATION_VALUE = "Other";
export const UNCLASSIFIED_CLASSIFICATION_VALUE = "Unclassified";
export const UNCLASSIFIED_VALUE =
	UNCLASSIFIED_CLASSIFICATION_VALUE.toLowerCase();

export type StructuralClassification =
	| typeof HEADER_CLASSIFICATION_VALUE
	| typeof TOTAL_CLASSIFICATION_VALUE
	| typeof OTHER_CLASSIFICATION_VALUE;

type StructuralRecord = Record<string, unknown>;
type ExplicitStructuralState = {
	hasExplicitState: boolean;
	classification: StructuralClassification | null;
};

const isStructuralRecord = (value: unknown): value is StructuralRecord =>
	value !== null && typeof value === "object";

const getNestedRecord = (
	record: StructuralRecord,
	key: string,
): StructuralRecord | null => {
	const nestedValue = record[key];
	return isStructuralRecord(nestedValue) ? nestedValue : null;
};

const getStructuralSources = (value: unknown): StructuralRecord[] => {
	if (!isStructuralRecord(value)) {
		return [];
	}

	const lineItem = getNestedRecord(value, "lineItem");
	const factValue = getNestedRecord(value, "fact_value");
	const lineItemFactValue = lineItem ? getNestedRecord(lineItem, "fact_value") : null;

	return (
		[value, lineItem, factValue, lineItemFactValue].filter(
			(source): source is StructuralRecord => source !== null,
		)
	);
};

const hasTrueFlag = (
	sources: StructuralRecord[],
	keys: string[],
): boolean => {
	return sources.some((source) =>
		keys.some((key) => source[key] === true),
	);
};

const resolveExplicitStructuralState = (
	value: unknown,
): ExplicitStructuralState => {
	if (!isStructuralRecord(value)) {
		return { hasExplicitState: false, classification: null };
	}

	if (
		Object.prototype.hasOwnProperty.call(value, "isAbstract") ||
		Object.prototype.hasOwnProperty.call(value, "isTotal")
	) {
		if (value.isAbstract === true) {
			return {
				hasExplicitState: true,
				classification: HEADER_CLASSIFICATION_VALUE,
			};
		}

		if (value.isTotal === true) {
			return {
				hasExplicitState: true,
				classification: TOTAL_CLASSIFICATION_VALUE,
			};
		}

		if (value.isOther === true) {
			return {
				hasExplicitState: true,
				classification: OTHER_CLASSIFICATION_VALUE,
			};
		}

		return { hasExplicitState: true, classification: null };
	}

	if (value.isOther === true) {
		return {
			hasExplicitState: true,
			classification: OTHER_CLASSIFICATION_VALUE,
		};
	}

	const explicitClassificationKeys = [
		"structuralClassification",
		"current_classification",
		"newClassification",
	] as const;

	for (const key of explicitClassificationKeys) {
		if (!Object.prototype.hasOwnProperty.call(value, key)) {
			continue;
		}

		const rawValue = value[key];
		if (
			typeof rawValue === "string" &&
			isStructuralClassificationValue(rawValue)
		) {
			return {
				hasExplicitState: true,
				classification: rawValue,
			};
		}
	}

	return { hasExplicitState: false, classification: null };
};

export const isStructuralClassificationValue = (
	value: string | null | undefined,
): value is StructuralClassification =>
	value === HEADER_CLASSIFICATION_VALUE ||
	value === TOTAL_CLASSIFICATION_VALUE ||
	value === OTHER_CLASSIFICATION_VALUE;

export const getStructuralFlagsForClassification = (
	classification: StructuralClassification | null | undefined,
) => ({
	is_header: classification === HEADER_CLASSIFICATION_VALUE,
	is_total: classification === TOTAL_CLASSIFICATION_VALUE,
	is_other: classification === OTHER_CLASSIFICATION_VALUE,
});

export const getStructuralPayloadFlagsForClassification = (
	classification: StructuralClassification | null | undefined,
) => {
	if (classification === HEADER_CLASSIFICATION_VALUE) {
		return { is_header: true } as const;
	}

	if (classification === TOTAL_CLASSIFICATION_VALUE) {
		return { is_total: true } as const;
	}

	if (classification === OTHER_CLASSIFICATION_VALUE) {
		return { is_other: true } as const;
	}

	return {};
};

export const hasStructuralClassificationProperty = (value: unknown): boolean => {
	if (!isStructuralRecord(value)) {
		return false;
	}

	return (
		Object.prototype.hasOwnProperty.call(value, "is_header") ||
		Object.prototype.hasOwnProperty.call(value, "is_total") ||
		Object.prototype.hasOwnProperty.call(value, "is_other")
	);
};

/**
 * Structural classifications:
 * Header -> section header rows
 * Total -> canonical calculated totals
 * Other -> structural subtotal-like rows excluded from calculations
 *
 * Priority when structural signals conflict is Header > Total > Other.
 * Raw backend is_other flags are intentionally not used as a fallback signal
 * here so existing rows are not silently reclassified or hidden.
 *
 * Note: Display and behavioral classification intentionally diverge for raw is_other rows.
 * The display chip may show "Other" for raw is_other rows, but rollup badge count, bulk edit,
 * and row styling still treat these rows as uncategorized unless taxonomy_concept is assigned.
 * This split is intentional to avoid regressions and should be maintained consciously.
 */
export const resolveStructuralClassification = (
	lineItem: unknown,
): StructuralClassification | null => {
	const explicitStructuralState = resolveExplicitStructuralState(lineItem);
	if (explicitStructuralState.hasExplicitState) {
		return explicitStructuralState.classification;
	}

	const sources = getStructuralSources(lineItem);

	if (
		hasTrueFlag(sources, ["is_header", "is_abstract", "isAbstract"])
	) {
		return HEADER_CLASSIFICATION_VALUE;
	}

	if (hasTrueFlag(sources, ["is_total", "isTotal"])) {
		return TOTAL_CLASSIFICATION_VALUE;
	}

	return null;
};
