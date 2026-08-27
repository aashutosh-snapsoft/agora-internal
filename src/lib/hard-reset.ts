const RESET_PATH = "/reset";

let hardResetInProgress = false;

export const isGraphqlSchemaError = (message: string): boolean => {
	const normalized = message.toLowerCase();
	return (
		normalized.includes("graphql") &&
		(normalized.includes("schema") ||
			normalized.includes("validation") ||
			normalized.includes("parse") ||
			normalized.includes("syntax"))
	);
};

type HardResetOptions = {
	forceSSO?: boolean;
};

export const triggerHardReset = (reason?: string, options?: HardResetOptions): void => {
	if (typeof window === "undefined") return;
	if (hardResetInProgress) return;
	if (window.location.pathname.startsWith(RESET_PATH)) return;

	hardResetInProgress = true;
	const url = new URL(RESET_PATH, window.location.origin);
	if (reason) {
		url.searchParams.set("reason", reason);
	}
	if (options?.forceSSO) {
		url.searchParams.set("forceSSO", "1");
	}
	window.location.replace(url.toString());
};

/**
 * Reload the page so the browser fetches fresh HTML and JS (new deployment).
 * Does not clear storage or log the user out. Use when version check detects a newer server build.
 */
export const triggerSoftReload = (): void => {
	if (typeof window === "undefined") return;
	window.location.reload();
};
