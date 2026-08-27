class MockIdentityError extends Error {
	status: number;
	details?: string;
	constructor(message: string, status = 401, details?: string) {
		super(message);
		this.name = "IdentityError";
		this.status = status;
		this.details = details;
	}
}

const mockGetUser = jest.fn();
jest.mock("@/lib/identity", () => ({
	getUserFromSessionOrThrow: mockGetUser,
	IdentityError: MockIdentityError,
}));

const mockListProjectsForUser = jest.fn();
const mockEnsureExists = jest.fn();
const mockFromEnv = jest.fn(() => ({
	ensureExists: mockEnsureExists,
	listProjectsForUser: mockListProjectsForUser,
}));
jest.mock("@/server/cosmos/financialModels", () => ({
	FinancialModelsContainer: { fromEnv: mockFromEnv },
}));

import { NextRequest } from "next/server";
import { GET } from "../route";

// A canonical-document projection as returned by listProjectsForUser
// (ProjectDirectoryDoc): id == project_id, with metadata.name AS name + sources.
const SAMPLE_DOC = {
	id: "proj-1",
	project_id: "proj-1",
	status: "complete",
	updated_at: "2026-05-20T00:00:00.000Z",
	name: "Acme Corp",
	sources: [{ filename: "fy24.xlsx" }, { filename: "fy23.xlsx" }],
};

function makeRequest(): NextRequest {
	return new NextRequest("http://localhost/api/directory/projects", {
		method: "GET",
	});
}

beforeEach(() => {
	jest.clearAllMocks();
	mockGetUser.mockResolvedValue({
		id: "user-1",
		external_id: "auth0|user-1-sub",
		tenant_id: "tenant-1",
		email: "user@example.com",
	});
	mockEnsureExists.mockResolvedValue(undefined);
	mockListProjectsForUser.mockResolvedValue([SAMPLE_DOC]);
});

describe("GET /api/directory/projects", () => {
	it("returns 200 with canonical docs mapped to ProjectDirectoryEntry[]", async () => {
		const res = await GET(makeRequest());
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([
			{
				projectId: "proj-1",
				name: "Acme Corp",
				sourceFiles: ["fy24.xlsx", "fy23.xlsx"],
				status: "complete",
				updatedAt: "2026-05-20T00:00:00.000Z",
			},
		]);
	});

	it("scopes the query to the caller's Auth0 sub (owner) and tenant", async () => {
		await GET(makeRequest());
		expect(mockListProjectsForUser).toHaveBeenCalledWith({
			ownerUserId: "auth0|user-1-sub",
			tenantId: "tenant-1",
		});
	});

	it("projects sources[].filename → sourceFiles, dropping null/empty entries", async () => {
		mockListProjectsForUser.mockResolvedValue([
			{
				...SAMPLE_DOC,
				sources: [{ filename: "keep.xlsx" }, null, { filename: "" }, { notFilename: "x" }],
			},
		]);
		const body = await (await GET(makeRequest())).json();
		expect(body[0].sourceFiles).toEqual(["keep.xlsx"]);
	});

	it("falls back projectId to project_id/projectId/id and name to empty string", async () => {
		mockListProjectsForUser.mockResolvedValue([{ id: "only-id", projectId: "camel-id" }]);
		const body = await (await GET(makeRequest())).json();
		expect(body[0].projectId).toBe("camel-id");
		expect(body[0].name).toBe("");
		expect(body[0].sourceFiles).toEqual([]);
		expect(body[0].updatedAt).toBe("");
	});

	// Locks the `d.project_id ?? d.projectId ?? d.id` chain in route.ts. The
	// invariant is "even if the canonical stamp ever drifts and only one of
	// the three id fields survives, the directory row still routes".
	it.each([
		{
			label: "prefers project_id when all three are present",
			doc: { project_id: "p1", projectId: "x", id: "y" },
			expected: "p1",
		},
		{
			label: "falls back to projectId when project_id is missing",
			doc: { projectId: "p2", id: "y" },
			expected: "p2",
		},
		{
			label: "falls back to id when neither project_id nor projectId is set",
			doc: { id: "p3" },
			expected: "p3",
		},
	])("projectId resolution: $label", async ({ doc, expected }) => {
		mockListProjectsForUser.mockResolvedValue([doc]);
		const body = await (await GET(makeRequest())).json();
		expect(body[0].projectId).toBe(expected);
	});

	it("returns an empty array when the user owns no projects", async () => {
		mockListProjectsForUser.mockResolvedValue([]);
		const res = await GET(makeRequest());
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});

	it("returns 403 when the user has no tenant_id", async () => {
		mockGetUser.mockResolvedValue({
			id: "user-1",
			external_id: "auth0|user-1-sub",
			tenant_id: null,
			email: "u@example.com",
		});
		const res = await GET(makeRequest());
		expect(res.status).toBe(403);
		expect(mockListProjectsForUser).not.toHaveBeenCalled();
	});

	it("returns 401 when identity throws IdentityError(401)", async () => {
		mockGetUser.mockRejectedValue(new MockIdentityError("Unauthorized", 401));
		const res = await GET(makeRequest());
		expect(res.status).toBe(401);
		expect((await res.json()).error).toBe("Unauthorized");
	});

	it("returns the IdentityError status code (not just 401)", async () => {
		mockGetUser.mockRejectedValue(new MockIdentityError("Server misconfiguration", 500));
		expect((await GET(makeRequest())).status).toBe(500);
	});

	it("returns 500 when Cosmos is not configured (fromEnv throws)", async () => {
		mockFromEnv.mockImplementationOnce(() => {
			throw new Error("COSMOS_ENDPOINT and COSMOS_KEY must be set");
		});
		expect((await GET(makeRequest())).status).toBe(500);
	});

	it("returns 502 when the Cosmos query throws (upstream failure)", async () => {
		mockListProjectsForUser.mockRejectedValue(new Error("cosmos down"));
		expect((await GET(makeRequest())).status).toBe(502);
	});

	it("does not read from Hasura (no global fetch call)", async () => {
		const fetchSpy = jest.fn();
		(global as unknown as { fetch: jest.Mock }).fetch = fetchSpy;
		await GET(makeRequest());
		expect(fetchSpy).not.toHaveBeenCalled();
		delete (global as unknown as { fetch?: jest.Mock }).fetch;
	});
});
