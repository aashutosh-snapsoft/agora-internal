import { Claim, ClaimState } from "@/types/claim";

const REVIEW_CLAIM_KEYS = new Set([
	"consistency_check_revenues",
	"consistency_check_gross_profit",
	"consistency_check_net_income",
	"consistency_check_assets",
	"consistency_check_liabilities",
	"consistency_check_stockholders_equity",
	"validation_check_assets_equal_liabilities_plus_equity",
]);

function claimRequiresReview(claim: Pick<Claim, "key" | "str_value">): boolean {
	if (!REVIEW_CLAIM_KEYS.has(claim.key)) {
		return false;
	}

	const description = claim.str_value ?? "";
	return (
		description.includes("does not match") ||
		description.includes("must be equal to") ||
		description.includes("missing") ||
		description.includes("could not be parsed")
	);
}

type ReviewStatusClaim = Pick<
	Claim,
	"key" | "str_value" | "context_id" | "created_at" | "period_id" | "line_item_id"
> & {
	states?: Array<Pick<ClaimState, "state" | "created_at">>;
};

function isInactiveClaimState(state?: string | null): boolean {
	const normalizedState = state?.trim().toLowerCase();
	return (
		normalizedState === "inactive" ||
		normalizedState === "resolved" ||
		normalizedState === "superseded" ||
		normalizedState === "deleted" ||
		normalizedState === "archived"
	);
}

function buildClaimVersionKey(claim: ReviewStatusClaim): string {
	return [
		claim.context_id,
		claim.key,
		claim.period_id ?? "",
		claim.line_item_id ?? "",
	].join(":");
}

function getTimestamp(value?: string | null): number {
	const timestamp = Date.parse(value ?? "");
	return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getLatestClaimState(claim: ReviewStatusClaim): string | null | undefined {
	if (!claim.states || claim.states.length === 0) {
		return undefined;
	}

	return [...claim.states].sort(
		(a, b) => getTimestamp(b.created_at) - getTimestamp(a.created_at)
	)[0]?.state;
}

function getCurrentClaims(claims: ReviewStatusClaim[]): ReviewStatusClaim[] {
	const latestClaimByKey = new Map<string, ReviewStatusClaim>();

	for (const claim of claims) {
		const claimKey = buildClaimVersionKey(claim);
		const existingClaim = latestClaimByKey.get(claimKey);
		if (
			!existingClaim ||
			getTimestamp(claim.created_at) >= getTimestamp(existingClaim.created_at)
		) {
			latestClaimByKey.set(claimKey, claim);
		}
	}

	return Array.from(latestClaimByKey.values()).filter((claim) => {
		const latestState = getLatestClaimState(claim);
		return !isInactiveClaimState(latestState);
	});
}

export function contextIdsRequireReview(
	claims: ReviewStatusClaim[],
	contextIds: string[]
): boolean {
	if (contextIds.length === 0) {
		return false;
	}

	const contextIdSet = new Set(contextIds);
	return getCurrentClaims(claims).some(
		(claim) =>
			contextIdSet.has(claim.context_id) &&
			claimRequiresReview(claim)
	);
}
