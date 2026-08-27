import { ConfidenceLevel } from "@/types/confidence-levels";

export type ReportedFilterType = ConfidenceLevel | "hidden";

/**
 * Given a confidence value, determines the confidence level.
 * @param value - A number between 0 and 1.
 * @returns A string indicating the classification ('low', 'medium', or 'high').
 */
export function classifyConfidence(value: number): ConfidenceLevel {
	if (value < 0 || value > 1) {
		return "unclassified";
	}
	if (value === 0) {
		return "unclassified";
	} else if (value < 0.3 && value > 0) {
		return "low";
	} else if (value <= 0.8) {
		return "medium";
	} else {
		return "high";
	}
}

export function classifyConfidenceChipColor(value: number): string {
	if (value < 0 || value > 1) {
		return "error";
	}
	if (value < 0.3) {
		return "error";
	} else if (value <= 0.8) {
		return "warning";
	} else {
		return "success";
	}
}

export function reportedLineItemFilters(
	value: number,
	isHiddenFilter: boolean
): ReportedFilterType {
	if (isHiddenFilter && value !== 0) return "hidden";

	return classifyConfidence(value);
}

export enum ReportedFilterTypeEnum {
	High = "high",
	Medium = "medium",
	Low = "low",
	Unclassified = "unclassified",
	Hidden = "hidden",
}
