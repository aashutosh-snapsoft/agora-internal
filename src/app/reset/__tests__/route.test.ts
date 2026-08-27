// Mock cache-control
jest.mock("@/lib/cache-control", () => ({
	NO_CACHE_HEADERS: {
		"Cache-Control": "no-store, no-cache, must-revalidate",
		Pragma: "no-cache",
		Expires: "0",
	},
	CLEAR_SITE_DATA_HEADERS: {
		"Clear-Site-Data": '"cookies"',
	},
}));

beforeEach(() => {
	jest.spyOn(console, "log").mockImplementation();
	jest.spyOn(console, "error").mockImplementation();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe("/reset route", () => {
	describe("when Auth0 is configured", () => {
		let GET: typeof import("../route").GET;

		beforeAll(async () => {
			process.env.NEXT_PUBLIC_AUTH0_DOMAIN = "test.auth0.com";
			process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID = "test-client-id";
			jest.resetModules();
			const mod = await import("../route");
			GET = mod.GET;
		});

		afterAll(() => {
			delete process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
			delete process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
		});

		it("returns 200 with HTML content type", async () => {
			const response = await GET();

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe(
				"text/html; charset=utf-8"
			);
		});

		it("includes no-cache and Clear-Site-Data headers", async () => {
			const response = await GET();

			expect(response.headers.get("Cache-Control")).toBe(
				"no-store, no-cache, must-revalidate"
			);
			expect(response.headers.get("Pragma")).toBe("no-cache");
			expect(response.headers.get("Expires")).toBe("0");
			expect(response.headers.get("Clear-Site-Data")).toBe('"cookies"');
		});

		it("includes client-state cleanup script", async () => {
			const response = await GET();
			const html = await response.text();

			expect(html).toContain("localStorage.clear()");
			expect(html).toContain("sessionStorage.clear()");
		});

		it("includes Auth0 logout URL with domain and client ID", async () => {
			const response = await GET();
			const html = await response.text();

			expect(html).toContain("https://test.auth0.com/v2/logout");
			expect(html).toContain("client_id=test-client-id");
		});

		it("redirects via Auth0 logout URL, not bare returnTo", async () => {
			const response = await GET();
			const html = await response.text();

			expect(html).toContain("window.location.replace(logoutUrl)");
			expect(html).not.toContain("window.location.replace(returnTo)");
		});
	});

	describe("when Auth0 is not configured", () => {
		let GET: typeof import("../route").GET;

		beforeAll(async () => {
			delete process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
			delete process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
			jest.resetModules();
			const mod = await import("../route");
			GET = mod.GET;
		});

		it("returns 200 (not 500)", async () => {
			const response = await GET();

			expect(response.status).toBe(200);
		});

		it("includes no-cache and Clear-Site-Data headers", async () => {
			const response = await GET();

			expect(response.headers.get("Cache-Control")).toBe(
				"no-store, no-cache, must-revalidate"
			);
			expect(response.headers.get("Clear-Site-Data")).toBe('"cookies"');
		});

		it("includes client-state cleanup script", async () => {
			const response = await GET();
			const html = await response.text();

			expect(html).toContain("localStorage.clear()");
			expect(html).toContain("sessionStorage.clear()");
		});

		it("redirects to /welcome without Auth0 logout", async () => {
			const response = await GET();
			const html = await response.text();

			expect(html).toContain("window.location.replace(returnTo)");
			// Should not contain an actual Auth0 logout URL (comments mentioning /v2/logout are fine)
			expect(html).not.toMatch(/https:\/\/.*\/v2\/logout/);
		});
	});
});
