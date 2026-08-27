import {
	doesReportedValueMatchSearch,
	filterRowsByDisplayedReportedValueSearch,
	getReportedSearchHighlightedParts,
	normalizeReportedSearchValue,
} from "../reported-search";

describe("reported-search", () => {
	describe("normalizeReportedSearchValue", () => {
		it("removes commas for displayed number matching", () => {
			expect(normalizeReportedSearchValue("296,160")).toBe("296160");
		});

		it("removes spaces and parentheses for displayed number matching", () => {
			expect(normalizeReportedSearchValue("(19,500)")).toBe("19500");
			expect(normalizeReportedSearchValue(" 001 230 ")).toBe("001230");
		});

		it("preserves minus signs and leading zeroes", () => {
			expect(normalizeReportedSearchValue("-01,230")).toBe("-01230");
		});

		it("removes decimal points and percent signs for ratio matching", () => {
			expect(normalizeReportedSearchValue("12.3%")).toBe("123");
		});

		it("treats placeholder values as empty", () => {
			expect(normalizeReportedSearchValue("-")).toBe("");
			expect(normalizeReportedSearchValue("\u2014")).toBe("");
			expect(normalizeReportedSearchValue("\u00E2\u20AC\u201D")).toBe("");
			expect(
				normalizeReportedSearchValue(
					"\u00C3\u00A2\u00E2\u201A\u00AC\u00E2\u20AC\u009D"
				)
			).toBe("");
		});
	});

	describe("doesReportedValueMatchSearch", () => {
		it("supports partial matching against normalized values", () => {
			expect(doesReportedValueMatchSearch("296,160", "296")).toBe(true);
			expect(doesReportedValueMatchSearch("296,160", "2961")).toBe(true);
			expect(doesReportedValueMatchSearch("296,160", "296160")).toBe(true);
		});

		it("matches formatted negative displays without removing minus signs", () => {
			expect(doesReportedValueMatchSearch("(19,500)", "195")).toBe(true);
			expect(doesReportedValueMatchSearch("(19,500)", "19500")).toBe(true);
			expect(doesReportedValueMatchSearch("-19,500", "-195")).toBe(true);
		});

		it("matches ratio displays when the visible value includes decimals and a percent sign", () => {
			expect(doesReportedValueMatchSearch("12.3%", "123")).toBe(true);
			expect(doesReportedValueMatchSearch("12.3%", "12.3")).toBe(true);
		});

		it("ignores empty and placeholder values", () => {
			expect(doesReportedValueMatchSearch("", "10")).toBe(false);
			expect(doesReportedValueMatchSearch(undefined, "10")).toBe(false);
			expect(doesReportedValueMatchSearch("-", "10")).toBe(false);
			expect(
				doesReportedValueMatchSearch("\u00E2\u20AC\u201D", "10")
			).toBe(false);
		});
	});

	describe("filterRowsByDisplayedReportedValueSearch", () => {
		const rows = [
			{ id: "row-1", "column-1": "296,160", "column-2": "-" },
			{ id: "row-2", "column-1": "(19,500)", "column-2": "" },
		];

		it("filters rows using the supplied displayed-value resolver", () => {
			expect(
				filterRowsByDisplayedReportedValueSearch(
					rows,
					["column-1", "column-2"],
					"195",
					(row, field) => row[field as keyof typeof row] as string
				)
			).toEqual([rows[1]]);
		});
	});

	describe("getReportedSearchHighlightedParts", () => {
		it("maps normalized matches back onto the displayed formatted string", () => {
			expect(getReportedSearchHighlightedParts("296,160", "2961")).toEqual([
				{ text: "296,1", isHighlighted: true },
				{ text: "60", isHighlighted: false },
			]);
		});

		it("highlights across commas and parentheses", () => {
			expect(getReportedSearchHighlightedParts("(19,500)", "195")).toEqual([
				{ text: "(", isHighlighted: false },
				{ text: "19,5", isHighlighted: true },
				{ text: "00)", isHighlighted: false },
			]);
		});

		it("highlights ratio matches across decimals while leaving the percent sign outside the match", () => {
			expect(getReportedSearchHighlightedParts("12.3%", "123")).toEqual([
				{ text: "12.3", isHighlighted: true },
				{ text: "%", isHighlighted: false },
			]);
		});

		it("does not highlight placeholder-only values", () => {
			expect(getReportedSearchHighlightedParts("-", "1")).toEqual([
				{ text: "-", isHighlighted: false },
			]);
		});
	});
});
