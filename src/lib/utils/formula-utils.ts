// Custom Excel-like functions for financial modeling
export const customExcelFunctions = {
  SUM: (...args: any[]) => args.reduce((a, b) => Number(a) + Number(b), 0),
  AVERAGE: (...args: any[]) => args.length ? args.reduce((a, b) => Number(a) + Number(b), 0) / args.length : 0,
  COUNT: (...args: any[]) => args.length,
  MULTIPLY: (a: any, b: any) => Number(a) * Number(b),
  DIVIDE: (a: any, b: any) => Number(b) === 0 ? 0 : Number(a) / Number(b),
  MAX: (...args: any[]) => Math.max(...args.map(Number)),
  MIN: (...args: any[]) => Math.min(...args.map(Number)),
  ROUND: (a: any, digits: any) => Number(a).toFixed(Number(digits)),
  IF: (cond: any, a: any, b: any) => cond ? a : b,
  // Revenue model specific
  REVENUE_GROWTH: (currentValue: any, growthRate: any) => (Number(currentValue) || 0) * (1 + (Number(growthRate) || 0) / 100),
  CAGR: (beginValue: any, endValue: any, periods: any) => {
    const begin = Number(beginValue) || 0;
    const end = Number(endValue) || 0;
    const numPeriods = Number(periods) || 1;
    if (begin <= 0 || end <= 0 || numPeriods <= 0) return 0;
    return (Math.pow(end / begin, 1 / numPeriods) - 1) * 100;
  },
  NPV: (rate: any, ...values: any[]) => {
    const r = Number(rate) || 0;
    return values.reduce((npv, cf, index) => npv + (Number(cf) || 0) / Math.pow(1 + r, index + 1), 0);
  },
};

// Parse Excel formula string (e.g., '=SUM(A1:A10)')
export function parseExcelFormula(formula: string, options: any = {}): string {
  // For now, just return the formula as-is (could add conversion logic)
  return formula;
}

// Validate formula string for safety
export function validateFormula(formula: string): boolean {
  // Basic validation: must start with '=' and not contain dangerous patterns
  if (!formula.startsWith('=')) return false;
  if (/\b(eval|Function|window|document)\b/.test(formula)) return false;
  return true;
} 