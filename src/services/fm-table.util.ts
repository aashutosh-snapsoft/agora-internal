import { Claim } from "@/types/claim";
import { Period } from "@/types/content";

/**
 * Normalize raw balance sheet rows:
 * Converts { "column-0-DEC 2021 A": "1,234", ... } into values: number[]
 */
export function normalizeBalanceSheetRows(rows: any[]): any[] {
	if (!rows || rows.length === 0) return [];

	const valueColumns = Object.keys(rows[0]).filter((key) =>
		key.startsWith("column-")
	);

	return rows.map((row) => {
		const values = valueColumns.map((col) => {
			const raw = row[col];
			const num = typeof raw === "string" ? Number(raw.replace(/,/g, "")) : raw;
			return isNaN(num) ? 0 : num;
		});

		return {
			...row,
			values,
		};
	});
}

export function insertBalanceCheckRow(
	rows: any[],
	claims: Claim[],
	periods: Period[]
): any[] {
	// Filter claims for balance check
	const balanceCheckClaims = claims.filter(
		(claim) =>
			claim.key === "validation_check_assets_equal_liabilities_plus_equity"
	);

	if (balanceCheckClaims.length === 0) {
		if (process.env.NODE_ENV !== "production" && rows.length > 0) {
			console.warn("No balance check claims found");
		}
		return rows;
	}

	// Get column structure from first row
	const sampleRow = rows[0];
	const columnKeys = Object.keys(sampleRow || {}).filter((key) =>
		key.startsWith("column-")
	);

	const balanceCheckRow: any = {
		id: "balance-check",
		lineItemName: "Balance Check",
		lineItem: null,
		unit: "USD",
	};

	// Add data for each period
	columnKeys.forEach((columnKey) => {
		const periodIndex = parseInt(columnKey.split("-")[1]);
		const period = periods[periodIndex];

		if (!period) {
			if (process.env.NODE_ENV !== "production") {
				console.warn(`No period found for column ${columnKey}`);
			}
			balanceCheckRow[columnKey] = 0;
			return;
		}

		const periodClaim = balanceCheckClaims.find(
			(claim) => claim.period_id === period.id
		);

		if (periodClaim) {
			// Use the validation result directly from claims
			balanceCheckRow[columnKey] =
				Number(periodClaim.str_value || periodClaim.num_value) || 0;
		} else {
			balanceCheckRow[columnKey] = 0;
		}
	});

	return [...rows, balanceCheckRow];
}

export function insertConsistencyCheckRow(
	rows: any[],
	claims: Claim[],
	periods: Period[]
): any[] {
	// Find Net Income row using rendered label (reliable)
	const netIncomeRow = rows.find(
  (row) => row?.key === "net-income-loss"
);


	if (!netIncomeRow) {
		if (process.env.NODE_ENV !== "production" && rows.length > 0) {
			console.warn(
				"No net income row found. Available rows:",
				rows.map((r) => r.lineItemName)
			);
		}
		return rows;
	}

	// Correct claim key
	const consistencyCheckClaims = claims.filter(
		(claim) => claim.key === "consistency_check_net_income"
	);

	if (consistencyCheckClaims.length === 0) {
		return rows;
	}

	const sampleRow = rows[0];
	const columnKeys = Object.keys(sampleRow || {}).filter((key) =>
		key.startsWith("column-")
	);

	const consistencyCheckRow: any = {
		id: "consistency-check",
		lineItemName: "Net Income (Loss) Consistent with Reported",
		lineItem: null,
		unit: "USD",
	};

	columnKeys.forEach((columnKey) => {
		const periodIndex = parseInt(columnKey.split("-")[1]);
		const period = periods[periodIndex];

		if (!period) {
			consistencyCheckRow[columnKey] = 0;
			return;
		}

		const periodClaim = consistencyCheckClaims.find(
			(claim) => claim.period_id === period.id
		);

		if (!periodClaim) {
			consistencyCheckRow[columnKey] = 0;
			return;
		}

		const claimDescription = periodClaim.str_value || "";
		const match = claimDescription.match(/\(Δ ([\d,]+\.?\d*)\)/);

		consistencyCheckRow[columnKey] = match
			? Number(match[1].replace(/,/g, ""))
			: 0;
	});

	const netIncomeIndex = rows.findIndex(
	(row) =>
		row?.id === "net-income-loss" ||
		row?.line_item_id === "net-income-loss"
	);

	if (netIncomeIndex === -1) {
		return rows;
	}

	return [
		...rows.slice(0, netIncomeIndex + 1),
		consistencyCheckRow,
		...rows.slice(netIncomeIndex + 1),
	];
}
