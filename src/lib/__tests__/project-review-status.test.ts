import { contextIdsRequireReview } from "../project-review-status";

describe("project review status helpers", () => {
	it("returns true when a validation mismatch claim exists for the project contexts", () => {
		expect(
			contextIdsRequireReview(
				[
					{
						key: "consistency_check_revenues",
						str_value: "Reported value does not match calculated value",
						context_id: "context-1",
						created_at: "2026-03-08T12:00:00.000Z",
						period_id: "period-1",
						line_item_id: "line-item-1",
					},
				],
				["context-1"]
			)
		).toBe(true);
	});

	it("returns false when claims exist but do not indicate review issues", () => {
		expect(
			contextIdsRequireReview(
				[
					{
						key: "consistency_check_revenues",
						str_value: "",
						context_id: "context-1",
						created_at: "2026-03-08T12:00:00.000Z",
						period_id: "period-1",
						line_item_id: "line-item-1",
					},
				],
				["context-1"]
			)
		).toBe(false);
	});

	it("ignores claims that belong to other contexts", () => {
		expect(
			contextIdsRequireReview(
				[
					{
						key: "consistency_check_assets",
						str_value: "missing value",
						context_id: "context-2",
						created_at: "2026-03-08T12:00:00.000Z",
						period_id: "period-1",
						line_item_id: "line-item-1",
					},
				],
				["context-1"]
			)
		).toBe(false);
	});

	it("ignores older failing claims when a newer claim for the same validation target is clean", () => {
		expect(
			contextIdsRequireReview(
				[
					{
						key: "consistency_check_assets",
						str_value: "Reported value does not match calculated value",
						context_id: "context-1",
						created_at: "2026-03-08T12:00:00.000Z",
						period_id: "period-1",
						line_item_id: "line-item-1",
					},
					{
						key: "consistency_check_assets",
						str_value: "",
						context_id: "context-1",
						created_at: "2026-03-08T13:00:00.000Z",
						period_id: "period-1",
						line_item_id: "line-item-1",
					},
				],
				["context-1"]
			)
		).toBe(false);
	});

	it("ignores claims whose latest state marks them inactive", () => {
		expect(
			contextIdsRequireReview(
				[
					{
						key: "consistency_check_assets",
						str_value: "missing value",
						context_id: "context-1",
						created_at: "2026-03-08T12:00:00.000Z",
						period_id: "period-1",
						line_item_id: "line-item-1",
						states: [
							{
								state: "resolved",
								created_at: "2026-03-08T13:00:00.000Z",
							},
						],
					},
				],
				["context-1"]
			)
		).toBe(false);
	});
});
