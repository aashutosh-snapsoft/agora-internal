/**
 * SENG-792 — the left-nav "Compose" button routed users to the orphaned Vercel
 * prototype (multidoc.socratics.ai) and was removed. These tests pin the two
 * acceptance criteria:
 *   1. no "Compose" item in the left nav, and
 *   2. no nav item can route to the multidoc app — even if someone points
 *      NEXT_PUBLIC_COMPOSE_BASE_URL back at the Vercel host.
 * Projects-page entry points (ComposeProjectsList) are page controls, not nav
 * controls, and are intentionally out of scope here.
 */
import type { Navigations } from "../navigation";

const ORIGINAL_BASE = process.env.NEXT_PUBLIC_COMPOSE_BASE_URL;

afterEach(() => {
	if (ORIGINAL_BASE === undefined) {
		delete process.env.NEXT_PUBLIC_COMPOSE_BASE_URL;
	} else {
		process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = ORIGINAL_BASE;
	}
});

// navigations resolves its paths at module load, so each test re-imports the
// module after arranging the environment.
function loadNavigations(): Navigations[] {
	let navs: Navigations[] = [];
	jest.isolateModules(() => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		navs = require("../navigation").navigations;
	});
	return navs;
}

describe("left nav (SENG-792)", () => {
	it("does not contain a Compose item", () => {
		const navs = loadNavigations();
		expect(navs.find((item) => item.name === "Compose")).toBeUndefined();
	});

	it("never routes to the multidoc app, even with the base URL pointed at the Vercel prototype", () => {
		process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = "https://multidoc.socratics.ai";
		const navs = loadNavigations();
		for (const item of navs) {
			// Catches both the Vercel host and any relative /multidoc-preview path.
			expect(item.path ?? "").not.toMatch(/multidoc/);
		}
	});

	it("keeps the surviving Projects and Support items", () => {
		const names = loadNavigations().map((item) => item.name);
		expect(names).toContain("Projects");
		expect(names).toContain("Support");
	});
});
