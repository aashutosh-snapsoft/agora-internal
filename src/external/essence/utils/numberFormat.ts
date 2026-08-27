export function numberFormat(
  number: number,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 3 },
) {
  return new Intl.NumberFormat("en-IN", options).format(number);
}
