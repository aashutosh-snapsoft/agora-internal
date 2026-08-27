import {
	displayTaxonomyName,
	formatTaxonomyLabel,
} from "./taxonomy-format";

describe("formatTaxonomyLabel", () => {
	it("applies SPECIAL_TAXONOMY_LABELS overrides case-insensitively", () => {
		expect(formatTaxonomyLabel("Revenues")).toBe("Net Revenue");
		expect(formatTaxonomyLabel("revenue")).toBe("Net Revenue");
		expect(formatTaxonomyLabel("NET INCOME (LOSS)")).toBe("Net Income");
		expect(formatTaxonomyLabel("net income loss")).toBe("Net Income");
		expect(formatTaxonomyLabel("net-income-loss")).toBe("Net Income");
	});

	it("formats hyphenated and underscored labels", () => {
		expect(formatTaxonomyLabel("gross-margin")).toBe("Gross Margin");
		expect(formatTaxonomyLabel("cost_of_revenue")).toBe("Cost Of Revenue");
	});

	it("returns trimmed label when no special formatting applies", () => {
		expect(formatTaxonomyLabel("  Operating Expenses  ")).toBe(
			"Operating Expenses",
		);
	});
});

describe("displayTaxonomyName", () => {
	it("returns taxonomy label when available", () => {
		const taxonomy = {
			id: "1",
			namespace: "ns",
			name: "operating_expenses",
			formula: "",
			type: "reported",
			presentation_linkbase: null,
			taxonomy_labels: [
				{ label: "gross-margin", label_language: "en", language_code: "en" },
			],
			template_concepts: [],
		} as any;

		expect(displayTaxonomyName(taxonomy)).toBe("Gross Margin");
	});

	it("falls back to formatted taxonomy name when taxonomy_labels is null", () => {
		const taxonomy = {
			id: "2",
			namespace: "ns",
			name: "revenues",
			formula: "",
			type: "reported",
			presentation_linkbase: null,
			taxonomy_labels: null,
			template_concepts: [],
		} as any;

		expect(displayTaxonomyName(taxonomy)).toBe("Net Revenue");
	});

	it("falls back to formatted taxonomy name when taxonomy_labels is undefined", () => {
		const taxonomy = {
			id: "3",
			namespace: "ns",
			name: "net_income_loss",
			formula: "",
			type: "reported",
			presentation_linkbase: null,
			taxonomy_labels: undefined,
			template_concepts: [],
		} as any;

		expect(displayTaxonomyName(taxonomy)).toBe("Net Income");
	});
});
