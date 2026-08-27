export const NO_CACHE_HEADERS: Record<string, string> = {
	"Cache-Control": "no-store, no-cache, must-revalidate",
	Pragma: "no-cache",
	Expires: "0",
};

export const CLEAR_SITE_DATA_HEADERS: Record<string, string> = {
	"Clear-Site-Data": "\"cache\", \"storage\", \"executionContexts\"",
};
