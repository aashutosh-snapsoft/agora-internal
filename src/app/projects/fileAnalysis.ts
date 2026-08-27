/**
 * File analysis — the seam between the upload screen and the real ingestion
 * backend.
 *
 * ⚠️ This runs BEFORE upload and does NOT read file contents: it only inspects
 * the file name, extension and size. So it cannot state facts about what's
 * inside a file — it can only offer an expectation ("likely Income Statement",
 * "looks scanned"). The UI reflects that: results are framed as filename-based
 * previews, confirmed after upload (see `analysisMessage` and the list's preview
 * note in ProjectsWorkspace). Never present these as parse results.
 *
 * `analyzeFile` is a STUB: replace its body with a real (post-upload) ingestion
 * call and keep the signature. The types, status model and message/tone helpers
 * are what the UI consumes and do not need to change when the backend lands.
 *
 * TODO(ingestion-backend): wire this to the real (post-upload) ingestion
 * backend and replace the heuristic previews with actual parse results — track
 * it with its own ticket, alongside handoffToAres's SCS-121. Until then the UI
 * must keep signalling that these are name-based estimates, not confirmed reads.
 */

/** Per-file lifecycle. `uploading`/`parsing` are transient; the rest settle. */
export type FileStatus = "uploading" | "parsing" | "ready" | "needs_attention" | "failed";

/** The three shapes of thing we can find in a financial upload. */
export interface SpreadsheetAnalysis {
	kind: "spreadsheet";
	sheetCount: number;
	/** Detected statement types, e.g. ["Income Statement", "Balance Sheet"]. */
	statementTypes: string[];
}
export interface PdfAnalysis {
	kind: "pdf";
	pageCount: number;
	ocr: "not_needed" | "needed" | "running";
}
export interface NoDataAnalysis {
	kind: "no_financial_data";
}
export type FileAnalysis = SpreadsheetAnalysis | PdfAnalysis | NoDataAnalysis;

/** What `analyzeFile` resolves to — a settled status plus (when read) its data. */
export interface AnalyzedFile {
	status: Extract<FileStatus, "ready" | "needs_attention" | "failed">;
	analysis?: FileAnalysis;
}

function ext(name: string): string {
	const dot = name.lastIndexOf(".");
	return dot !== -1 ? name.slice(dot + 1).toLowerCase() : "";
}

/** Cheap deterministic pseudo-count from file size, so the UI is stable. */
function sizeScaled(bytes: number, per: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, Math.round(bytes / per)));
}

/** A PDF whose name reads like a scan is treated as needing OCR. (Deliberately
 *  narrow — "statement" alone is not enough; a typed financial-statements PDF is
 *  not a scan.) */
function looksScanned(name: string): boolean {
	return /scan|scanned|bank|receipt|img[_-]?\d/i.test(name);
}

/**
 * ⚠️ STUB — deterministic, deliberately-mixed fake results (not all-success),
 * keyed off extension / filename / size so the same file always analyses the
 * same way. Replace the body with the real ingestion call; keep the signature
 * `(file: File) => Promise<AnalyzedFile>`.
 */
export function analyzeFile(file: File): Promise<AnalyzedFile> {
	// Scanned PDFs "run OCR", so they take longer — the UI shows that wait.
	const delay = ext(file.name) === "pdf" && looksScanned(file.name) ? 1900 : 1000;
	return new Promise((resolve) => {
		setTimeout(() => resolve(fakeAnalyze(file)), delay);
	});
}

function fakeAnalyze(file: File): AnalyzedFile {
	const e = ext(file.name);
	const name = file.name;

	// An empty upload can't be read at all.
	if (file.size === 0) return { status: "failed" };

	if (["xls", "xlsx", "xlsm", "csv"].includes(e)) {
		const sheetCount = e === "csv" ? 1 : sizeScaled(file.size, 400_000, 1, 12);
		const statementTypes: string[] = [];
		if (/gl|ledger/i.test(name)) statementTypes.push("General Ledger");
		if (/financ|statement|income|p&l|pl/i.test(name)) statementTypes.push("Income Statement", "Balance Sheet");
		if (/cash|cf/i.test(name)) statementTypes.push("Cash Flow");
		if (/payroll/i.test(name)) statementTypes.push("Payroll Register");
		if (/trial|tb/i.test(name)) statementTypes.push("Trial Balance");
		// A spreadsheet with nothing recognisable is worth flagging, not failing.
		return statementTypes.length > 0
			? { status: "ready", analysis: { kind: "spreadsheet", sheetCount, statementTypes } }
			: { status: "needs_attention", analysis: { kind: "spreadsheet", sheetCount, statementTypes: [] } };
	}

	if (e === "pdf") {
		const pageCount = sizeScaled(file.size, 90_000, 1, 240);
		return looksScanned(name)
			? { status: "needs_attention", analysis: { kind: "pdf", pageCount, ocr: "needed" } }
			: { status: "ready", analysis: { kind: "pdf", pageCount, ocr: "not_needed" } };
	}

	// Everything else (decks, letters, images…) carries no extractable financials.
	return { status: "needs_attention", analysis: { kind: "no_financial_data" } };
}

/** Colour family for a status — the component maps this to a token + icon. */
export type StatusTone = "progress" | "success" | "warning" | "error";

export const STATUS_TONE: Record<FileStatus, StatusTone> = {
	uploading: "progress",
	parsing: "progress",
	ready: "success",
	needs_attention: "warning",
	failed: "error",
};

/** Short label for a status, used in the screen-reader announcement. */
export const STATUS_LABEL: Record<FileStatus, string> = {
	uploading: "uploading",
	parsing: "checking",
	ready: "looks ready",
	needs_attention: "worth a look",
	failed: "failed",
};

/**
 * The line shown under the filename. Because nothing is read before upload,
 * every settled line is an EXPECTATION drawn from the file name/type — never a
 * parse result. Hence "likely" / "looks", and no fabricated sheet or page
 * counts. The list header carries the "confirmed after upload" caveat once, so
 * each row stays short. Pure: given the status and (settled) analysis it returns
 * the exact copy.
 */
export function analysisMessage(status: FileStatus, analysis: FileAnalysis | undefined, _fileName: string): string {
	if (status === "uploading") return "Uploading…";
	// Only names/sizes are inspected here, so this is "checking", never "reading".
	if (status === "parsing") return "Checking…";
	if (status === "failed") return "Empty file — nothing to read";

	if (!analysis) return status === "ready" ? "Looks ready" : "Worth a look";

	switch (analysis.kind) {
		case "spreadsheet":
			return analysis.statementTypes.length > 0
				? `Spreadsheet · likely ${analysis.statementTypes.join(", ")}`
				: "Spreadsheet · contents confirmed after upload";
		case "pdf":
			return analysis.ocr === "needed"
				? "PDF · looks scanned, may need OCR"
				: "PDF · looks text-based";
		case "no_financial_data":
			return "May not contain financial data";
	}
}
