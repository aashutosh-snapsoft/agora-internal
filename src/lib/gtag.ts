type GtagFunction = (...args: any[]) => void;

// Only access window.gtag while running client-side so SSR builds stay clean.
const getGtagFunction = (): GtagFunction | undefined => {
	if (typeof window === "undefined") {
		return undefined;
	}

	const maybeGtag = (window as Window & { gtag?: GtagFunction }).gtag;

	return typeof maybeGtag === "function" ? maybeGtag : undefined;
};

// Wrap gtag calls so missing analytics scripts become no-ops instead of throwing.
export const callGtag = (...args: Parameters<GtagFunction>) => {
	const gtagFn = getGtagFunction();

	if (gtagFn) {
		gtagFn(...args);
	}
};

export const trackGtagEvent = (
	eventName: string,
	params?: Record<string, unknown>
) => {
	callGtag("event", eventName, params);
};
