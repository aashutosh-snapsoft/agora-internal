import { getProjectStableKey } from './getProjectStableKey';

type LineItem = {
	id: string;
	taxonomy_concept_id?: string | null;
	state?: string;
	fact_value?: unknown;
	is_visible?: boolean;
	unit?: string;
};

type Period = {
	id: string;
	entry_type?: string;
	start_date?: string;
	end_date?: string;
};

function makeProject(overrides?: {
	id?: string;
	state?: string;
	statements?: {
		buildId?: string;
		contextId?: string;
		periods?: Period[];
		line_items?: LineItem[];
	};
}) {
	const stmt = overrides?.statements;
	const buildStatement = stmt
		? {
				builds: [
					{
						id: stmt.buildId ?? 'build-1',
						primary_context: {
							id: stmt.contextId ?? 'ctx-1',
							periods: stmt.periods ?? [{ id: 'p-1' }, { id: 'p-2' }],
							line_items: stmt.line_items ?? [
								{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending' },
								{ id: 'li-2', taxonomy_concept_id: 'tax-b', state: 'pending' },
							],
						},
					},
				],
			}
		: {
				builds: [
					{
						id: 'build-1',
						primary_context: {
							id: 'ctx-1',
							periods: [{ id: 'p-1' }, { id: 'p-2' }],
							line_items: [
								{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending' },
								{ id: 'li-2', taxonomy_concept_id: 'tax-b', state: 'pending' },
							],
						},
					},
				],
			};

	return {
		id: overrides?.id ?? 'proj-1',
		project_states: [{ state: overrides?.state ?? 'calculated' }],
		income_statement: structuredClone(buildStatement),
		balance_sheet: structuredClone(buildStatement),
		cashflow_statement: structuredClone(buildStatement),
	};
}

describe('getProjectStableKey', () => {
	it('returns null for null/undefined project', () => {
		expect(getProjectStableKey(null)).toBeNull();
		expect(getProjectStableKey(undefined)).toBeNull();
	});

	it('returns same key when Redux creates a new reference with identical data', () => {
		const a = makeProject();
		const b = JSON.parse(JSON.stringify(a));
		expect(getProjectStableKey(a)).toBe(getProjectStableKey(b));
	});

	it('returns different keys when line item taxonomy_concept_id changes but count stays the same', () => {
		const base = makeProject({
			statements: {
				line_items: [{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending' }],
			},
		});
		const mutated = makeProject({
			statements: {
				line_items: [{ id: 'li-1', taxonomy_concept_id: 'tax-b', state: 'pending' }],
			},
		});
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(mutated));
	});

	it('returns different keys when line item state changes', () => {
		const base = makeProject({
			statements: {
				line_items: [{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending' }],
			},
		});
		const mutated = makeProject({
			statements: {
				line_items: [{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'hidden' }],
			},
		});
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(mutated));
	});

	it('returns different keys when a period is added', () => {
		const base = makeProject({
			statements: { periods: [{ id: 'p-1' }] },
		});
		const withExtra = makeProject({
			statements: { periods: [{ id: 'p-1' }, { id: 'p-2' }] },
		});
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(withExtra));
	});

	it('returns different keys when context ID changes', () => {
		const base = makeProject({
			statements: { contextId: 'ctx-1' },
		});
		const switched = makeProject({
			statements: { contextId: 'ctx-2' },
		});
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(switched));
	});

	it('returns different keys when line item order changes', () => {
		const base = makeProject({
			statements: {
				line_items: [
					{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending' },
					{ id: 'li-2', taxonomy_concept_id: 'tax-b', state: 'pending' },
				],
			},
		});
		const reordered = makeProject({
			statements: {
				line_items: [
					{ id: 'li-2', taxonomy_concept_id: 'tax-b', state: 'pending' },
					{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending' },
				],
			},
		});
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(reordered));
	});

	it('returns different keys when build ID changes', () => {
		const base = makeProject({ statements: { buildId: 'build-1' } });
		const changed = makeProject({ statements: { buildId: 'build-2' } });
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(changed));
	});

	it('returns different keys when project state changes', () => {
		const base = makeProject({ state: 'calculating' });
		const changed = makeProject({ state: 'calculated' });
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(changed));
	});

	it('handles missing builds/contexts gracefully', () => {
		const project = {
			id: 'proj-1',
			project_states: [{ state: 'calculated' }],
			income_statement: { builds: [] },
			balance_sheet: null,
			cashflow_statement: undefined,
		};
		expect(() => getProjectStableKey(project)).not.toThrow();
		expect(typeof getProjectStableKey(project)).toBe('string');
	});

	it('returns different keys when fact_value changes', () => {
		const base = makeProject({
			statements: {
				line_items: [
					{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending', fact_value: { value: '100' } },
				],
			},
		});
		const mutated = makeProject({
			statements: {
				line_items: [
					{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending', fact_value: { value: '200' } },
				],
			},
		});
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(mutated));
	});

	it('returns different keys when period entry_type changes', () => {
		const base = makeProject({
			statements: {
				periods: [{ id: 'p-1', entry_type: 'reported' }],
			},
		});
		const mutated = makeProject({
			statements: {
				periods: [{ id: 'p-1', entry_type: 'forecast' }],
			},
		});
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(mutated));
	});

	it('returns different keys when period start_date changes', () => {
		const base = makeProject({
			statements: {
				periods: [{ id: 'p-1', start_date: '2024-01-01' }],
			},
		});
		const mutated = makeProject({
			statements: {
				periods: [{ id: 'p-1', start_date: '2024-06-01' }],
			},
		});
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(mutated));
	});

	it('returns different keys when line item is_visible changes', () => {
		const base = makeProject({
			statements: {
				line_items: [
					{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending', is_visible: true },
				],
			},
		});
		const mutated = makeProject({
			statements: {
				line_items: [
					{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending', is_visible: false },
				],
			},
		});
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(mutated));
	});

	it('returns different keys when line item unit changes', () => {
		const base = makeProject({
			statements: {
				line_items: [
					{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending', unit: 'USD' },
				],
			},
		});
		const mutated = makeProject({
			statements: {
				line_items: [
					{ id: 'li-1', taxonomy_concept_id: 'tax-a', state: 'pending', unit: 'EUR' },
				],
			},
		});
		expect(getProjectStableKey(base)).not.toBe(getProjectStableKey(mutated));
	});
});
