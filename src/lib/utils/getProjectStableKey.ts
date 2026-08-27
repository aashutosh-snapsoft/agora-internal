/**
 * Derives a stable string key from a project's meaningful fields.
 * Used to prevent unnecessary re-renders/effect re-runs when
 * Redux reference identity changes but the actual data hasn't.
 *
 * Uses JSON.stringify on primary_context to capture all data-level
 * mutations (fact_value, entry_type, dates, is_visible, unit, etc.)
 * without maintaining an explicit field list.
 */
type FMComponentLike = {
	builds?: { id?: string; primary_context?: unknown }[];
} | null | undefined;

export function getProjectStableKey(
	project: {
		id?: string;
		income_statement?: FMComponentLike;
		balance_sheet?: FMComponentLike;
		cashflow_statement?: FMComponentLike;
		project_states?: { state?: string }[];
	} | null | undefined,
): string | null {
	if (!project) return null;
	const is = project.income_statement?.builds?.[0];
	const bs = project.balance_sheet?.builds?.[0];
	const cf = project.cashflow_statement?.builds?.[0];
	return [
		project.id,
		project.project_states?.[0]?.state ?? '',
		is?.id ?? '',
		bs?.id ?? '',
		cf?.id ?? '',
		JSON.stringify(is?.primary_context ?? ''),
		JSON.stringify(bs?.primary_context ?? ''),
		JSON.stringify(cf?.primary_context ?? ''),
	].join('||');
}
