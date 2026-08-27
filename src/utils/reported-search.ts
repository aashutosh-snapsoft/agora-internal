const SEARCH_FORMATTING_CHARACTERS = /[,\s().%]/g;
const EMPTY_REPORTED_VALUE_PLACEHOLDERS = new Set([
	"-",
	"\u2014",
	"\u00E2\u20AC\u201D",
	"\u00C3\u00A2\u00E2\u201A\u00AC\u00E2\u20AC\u009D",
]);

export interface ReportedSearchHighlightPart {
	text: string;
	isHighlighted: boolean;
}

function isSearchFormattingCharacter(character: string) {
	return /[,\s().%]/.test(character);
}

function isEmptyReportedValuePlaceholder(value: string | null | undefined) {
	if (typeof value !== "string") {
		return false;
	}

	return EMPTY_REPORTED_VALUE_PLACEHOLDERS.has(value.trim());
}

function buildNormalizedCharacterMap(value: string) {
	let normalizedValue = "";
	const normalizedToRawIndex: number[] = [];

	for (let index = 0; index < value.length; index += 1) {
		const character = value[index];

		if (isSearchFormattingCharacter(character)) {
			continue;
		}

		normalizedValue += character;
		normalizedToRawIndex.push(index);
	}

	return {
		normalizedValue,
		normalizedToRawIndex,
	};
}

export function normalizeReportedSearchValue(
	value: string | null | undefined
): string {
	if (typeof value !== "string") {
		return "";
	}

	const trimmedValue = value.trim();
	if (!trimmedValue || isEmptyReportedValuePlaceholder(trimmedValue)) {
		return "";
	}

	return trimmedValue.replace(SEARCH_FORMATTING_CHARACTERS, "");
}

export function doesReportedValueMatchSearch(
	value: string | null | undefined,
	searchValue: string
) {
	const normalizedSearchValue = normalizeReportedSearchValue(searchValue);
	if (!normalizedSearchValue) {
		return false;
	}

	const normalizedCellValue = normalizeReportedSearchValue(value);
	if (!normalizedCellValue) {
		return false;
	}

	return normalizedCellValue.includes(normalizedSearchValue);
}

export function filterRowsByDisplayedReportedValueSearch<T>(
	rows: T[],
	searchableFields: string[],
	searchValue: string,
	getDisplayedValue: (row: T, field: string) => string | null | undefined
) {
	const normalizedSearchValue = normalizeReportedSearchValue(searchValue);
	if (!normalizedSearchValue) {
		return rows;
	}

	return rows.filter((row) =>
		searchableFields.some((field) =>
			doesReportedValueMatchSearch(
				getDisplayedValue(row, field),
				normalizedSearchValue
			)
		)
	);
}

export function getReportedSearchHighlightedParts(
	value: string | null | undefined,
	searchValue: string
): ReportedSearchHighlightPart[] {
	if (typeof value !== "string" || !value.length) {
		return [];
	}

	const normalizedSearchValue = normalizeReportedSearchValue(searchValue);
	if (!normalizedSearchValue) {
		return [{ text: value, isHighlighted: false }];
	}

	if (isEmptyReportedValuePlaceholder(value)) {
		return [{ text: value, isHighlighted: false }];
	}

	const { normalizedValue, normalizedToRawIndex } =
		buildNormalizedCharacterMap(value);
	const matchStart = normalizedValue.indexOf(normalizedSearchValue);

	if (matchStart === -1) {
		return [{ text: value, isHighlighted: false }];
	}

	const matchEnd = matchStart + normalizedSearchValue.length - 1;
	const rawStart = normalizedToRawIndex[matchStart];
	const rawEnd = normalizedToRawIndex[matchEnd];

	if (rawStart === undefined || rawEnd === undefined) {
		return [{ text: value, isHighlighted: false }];
	}

	const parts: ReportedSearchHighlightPart[] = [];

	if (rawStart > 0) {
		parts.push({
			text: value.slice(0, rawStart),
			isHighlighted: false,
		});
	}

	parts.push({
		text: value.slice(rawStart, rawEnd + 1),
		isHighlighted: true,
	});

	if (rawEnd + 1 < value.length) {
		parts.push({
			text: value.slice(rawEnd + 1),
			isHighlighted: false,
		});
	}

	return parts.filter((part) => part.text.length > 0);
}
