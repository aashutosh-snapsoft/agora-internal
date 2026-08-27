import {
	composeUploadUrl,
	newComposeUrl,
	resumeComposeUrl,
	type ComposeStep,
} from "../composeUrl";

const ORIGINAL_BASE = process.env.NEXT_PUBLIC_COMPOSE_BASE_URL;

beforeEach(() => {
	// Reset between tests; individual tests opt into a specific base.
	delete process.env.NEXT_PUBLIC_COMPOSE_BASE_URL;
});

afterAll(() => {
	if (ORIGINAL_BASE === undefined) {
		delete process.env.NEXT_PUBLIC_COMPOSE_BASE_URL;
	} else {
		process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = ORIGINAL_BASE;
	}
});

describe("resumeComposeUrl", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = "https://multidoc.test";
	});

	it("emits /multidoc-preview/{documentId} with the projectId param for the merge step", () => {
		const url = resumeComposeUrl("merge", "proj-1", "doc-A");
		expect(url).toBe(
			"https://multidoc.test/multidoc-preview/doc-A?projectId=proj-1&step=merge",
		);
	});

	it("uses step=validate for the audit step (v2-frontend's internal name)", () => {
		const url = resumeComposeUrl("audit", "proj-1", "doc-A");
		expect(url).toBe(
			"https://multidoc.test/multidoc-preview/doc-A?projectId=proj-1&step=validate",
		);
	});

	it("uses substep=assign for the assign step", () => {
		const url = resumeComposeUrl("assign", "proj-1", "doc-A");
		expect(url).toBe(
			"https://multidoc.test/multidoc-preview/doc-A?projectId=proj-1&substep=assign",
		);
	});

	it("omits the step param for upload (workflow lands on the default first step)", () => {
		const url = resumeComposeUrl("upload", "proj-1", "doc-A");
		expect(url).toBe(
			"https://multidoc.test/multidoc-preview/doc-A?projectId=proj-1",
		);
	});

	it("URL-encodes special characters in projectId and documentId", () => {
		const url = resumeComposeUrl("merge", "proj 1", "doc/A");
		// Both the projectId query param and the documentId path segment are
		// encoded. UUIDs (the production caller) pass through unchanged; the
		// encoding defends against future slug-style ids.
		expect(url).toBe(
			"https://multidoc.test/multidoc-preview/doc%2FA?projectId=proj+1&step=merge",
		);
	});

	it("works with an empty base (relative URL fallback for same-origin deploys)", () => {
		delete process.env.NEXT_PUBLIC_COMPOSE_BASE_URL;
		const url = resumeComposeUrl("merge", "proj-1", "doc-A");
		expect(url).toBe("/multidoc-preview/doc-A?projectId=proj-1&step=merge");
	});
});

describe("newComposeUrl", () => {
	beforeEach(() => {
		process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = "https://multidoc.test";
	});

	it("emits /multidoc-preview with only the projectId param", () => {
		const url = newComposeUrl("proj-new");
		expect(url).toBe(
			"https://multidoc.test/multidoc-preview?projectId=proj-new",
		);
	});

	it("URL-encodes the projectId", () => {
		const url = newComposeUrl("proj with space");
		expect(url).toBe(
			"https://multidoc.test/multidoc-preview?projectId=proj+with+space",
		);
	});

	it("works with an empty base (relative URL fallback)", () => {
		delete process.env.NEXT_PUBLIC_COMPOSE_BASE_URL;
		const url = newComposeUrl("proj-new");
		expect(url).toBe("/multidoc-preview?projectId=proj-new");
	});
});

describe("hosted /workflow mount (SENG-791)", () => {
	// In the hosted deployment Agora (/projects) and v2-frontend (/workflow) sit
	// on the same origin behind App Gateway, which routes /workflow/* → v2. The
	// base is the same-origin relative mount, so the handoff URLs must carry the
	// /workflow prefix and never point back at the Vercel prototype.
	beforeEach(() => {
		process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = "/workflow";
	});

	it("resumeComposeUrl emits the /workflow-mounted document route", () => {
		expect(resumeComposeUrl("merge", "p", "d")).toBe(
			"/workflow/multidoc-preview/d?projectId=p&step=merge",
		);
	});

	it("newComposeUrl emits the /workflow-mounted new-project route", () => {
		expect(newComposeUrl("p")).toBe(
			"/workflow/multidoc-preview?projectId=p",
		);
	});

	it("composeUploadUrl emits the /workflow-mounted upload entry", () => {
		expect(composeUploadUrl()).toBe("/workflow/multidoc-preview");
	});

	it("never routes to the Vercel prototype host", () => {
		const urls = [
			resumeComposeUrl("audit", "p", "d"),
			newComposeUrl("p"),
			composeUploadUrl(),
		];
		for (const url of urls) {
			expect(url).not.toContain("multidoc.socratics.ai");
		}
	});
});

describe("baseUrl dev guard (SENG-791 review #1)", () => {
	// Empty base now resolves inside Agora and 404s, so dev gets a console
	// warning instead of a silent broken link. Jest defaults NODE_ENV to "test",
	// so the other suites stay silent; force "development" only here.
	const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
	let warnSpy: jest.SpyInstance;

	beforeEach(() => {
		process.env.NODE_ENV = "development";
		warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(() => {
		warnSpy.mockRestore();
		process.env.NODE_ENV = ORIGINAL_NODE_ENV;
	});

	it("warns in development when the base is unset", () => {
		delete process.env.NEXT_PUBLIC_COMPOSE_BASE_URL;
		composeUploadUrl();
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("NEXT_PUBLIC_COMPOSE_BASE_URL is not set"),
		);
	});

	it("does not warn when the base is set", () => {
		process.env.NEXT_PUBLIC_COMPOSE_BASE_URL = "/workflow";
		composeUploadUrl();
		expect(warnSpy).not.toHaveBeenCalled();
	});
});

describe("ComposeStep — exhaustive type", () => {
	// If this test ever needs updating, also update resumeComposeUrl's switch.
	// Both must stay in lock-step so adding a step variant fails to compile.
	it("has exactly the four expected variants", () => {
		const steps: ComposeStep[] = ["upload", "assign", "merge", "audit"];
		expect(steps).toHaveLength(4);
	});
});
