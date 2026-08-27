export function numberFormat(
	number: number,
	options: Intl.NumberFormatOptions = {
		maximumFractionDigits: 0,
		minimumFractionDigits: 0,
	}
) {
	return new Intl.NumberFormat("en-IN", options).format(number);
}

export function numberFormatGenerator(
	options: Intl.NumberFormatOptions = {
		maximumFractionDigits: 0,
		minimumFractionDigits: 0,
	}
) {
	/**
	 * This formats numbers using a generated number formatter.
	 * The generated number formatter is created using `numberFormatGenerator`.
	 *
	 * @param number - The number to format.
	 * @returns The formatted number.
	 */
	return (number: number): string => {
		const formatter = new Intl.NumberFormat("en-US", {
			style: "decimal",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
			...options,
		});
		return formatter.format(number);
	};
}
export function stripNegativeSign(value: string): string {
	return value.replace("-", "");
}
