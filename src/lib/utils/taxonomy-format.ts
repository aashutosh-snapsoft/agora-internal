import { LineItem, TaxonomyConcept } from "@/types/content";
import { formatTitle } from "./titleFormatter";

const SPECIAL_TAXONOMY_LABELS: Record<string, string> = {
	revenues: "Net Revenue",
	revenue: "Net Revenue",
	"net income (loss)": "Net Income",
	"net income loss": "Net Income",
	"net-income-loss": "Net Income",
	"net_income_loss": "Net Income",
};

const getFallbackTaxonomyLabel = (name: string): string | null => {
	const normalized = name.trim().toLowerCase();
	return SPECIAL_TAXONOMY_LABELS[normalized] ?? null;
};

export const formatTaxonomyLabel = (label: string): string => {
	const fallback = getFallbackTaxonomyLabel(label);
	if (fallback) {
		return fallback;
	}

	const trimmed = label.trim();
	if (!trimmed) {
		return "";
	}

	if (trimmed.includes("-") || trimmed.includes("_")) {
		return formatTitle(trimmed.replace(/_/g, "-"));
	}

	return trimmed;
};

export function displayLineItemName(
	lineItem: LineItem,
	isSummaryRollup: boolean = false
): string {
	if (isSummaryRollup) {
		return displayTaxonomyName(lineItem.taxonomy_concept!);
	}
	const rawName = lineItem.fact_value.raw_name;

	if (rawName) {
		return rawName;
	}

	if (lineItem.taxonomy_concept) {
		return displayTaxonomyName(lineItem.taxonomy_concept!);
	}

	return "-";
}

export function displayTaxonomyName(taxonomy: TaxonomyConcept): string {
	if (!taxonomy) {
		return "?";
	}

	if (!taxonomy.taxonomy_labels) {
		return formatTaxonomyLabel(taxonomy.name);
	}

	const label = taxonomy.taxonomy_labels?.[0]?.label;
	if (label) {
		return formatTaxonomyLabel(label);
	}

	const fallbackLabel = getFallbackTaxonomyLabel(taxonomy.name);
	if (fallbackLabel) {
		return fallbackLabel;
	}

	return formatTitle(taxonomy.name);
}
