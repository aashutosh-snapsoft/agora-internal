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

// Real NotFoundOrForbiddenError class — the route uses `instanceof` to detect
// it, so we must use the actual class (not a duck-typed stub).
class MockNotFoundOrForbiddenError extends Error {
	readonly code = 404 as const;
	constructor() {
		super("Not found or forbidden");
		this.name = "NotFoundOrForbiddenError";
	}
}

const mockGetUser = jest.fn();
jest.mock("@/lib/identity", () => ({
	getUserFromSessionOrThrow: mockGetUser,
	IdentityError: MockIdentityError,
}));

const mockDeleteProject = jest.fn();
const mockFromEnv = jest.fn(() => ({
	deleteProject: mockDeleteProject,
}));
jest.mock("@/server/cosmos/financialModels", () => ({
	FinancialModelsContainer: { fromEnv: mockFromEnv },
	NotFoundOrForbiddenError: MockNotFoundOrForbiddenError,
}));

import { NextRequest } from "next/server";
import { DELETE } from "../route";

function makeRequest(projectId = "proj-1"): [NextRequest, { params: Promise<{ projectId: string }> }] {
	return [
		new NextRequest(`http://localhost/api/directory/projects/${projectId}`, {
			method: "DELETE",
		}),
		{ params: Promise.resolve({ projectId }) },
	];
}

const AUTHED_USER = {
	id: "user-1",
	external_id: "auth0|user-1-sub",
	tenant_id: "tenant-1",
	email: "user@example.com",
};

beforeEach(() => {
	jest.clearAllMocks();
	mockGetUser.mockResolvedValue(AUTHED_USER);
	mockDeleteProject.mockResolvedValue(undefined);
});

describe("DELETE /api/directory/projects/[projectId]", () => {
	it("returns 204 when the owner successfully deletes their own project", async () => {
		const [req, ctx] = makeRequest("proj-1");
		const res = await DELETE(req, ctx);
		expect(res.status).toBe(204);
	});

	it("passes tenantId and ownerUserId to deleteProject", async () => {
		const [req, ctx] = makeRequest("proj-1");
		await DELETE(req, ctx);
		expect(mockDeleteProject).toHaveBeenCalledWith({
			projectId: "proj-1",
			tenantId: "tenant-1",
			ownerUserId: "auth0|user-1-sub",
		});
	});

	it("returns 404 when deleteProject throws NotFoundOrForbiddenError (not found)", async () => {
		mockDeleteProject.mockRejectedValue(new MockNotFoundOrForbiddenError());
		const [req, ctx] = makeRequest("proj-1");
		const res = await DELETE(req, ctx);
		expect(res.status).toBe(404);
		// Ownership check failure and missing doc are indistinguishable (no oracle)
		expect(mockDeleteProject).toHaveBeenCalledTimes(1);
	});

	it("returns 404 (not 403) when a cross-tenant delete is attempted", async () => {
		// The ownership check inside deleteProject throws NotFoundOrForbiddenError for
		// both "not found" and "not owned" — this test verifies the route honours that.
		mockDeleteProject.mockRejectedValue(new MockNotFoundOrForbiddenError());
		const [req, ctx] = makeRequest("other-tenant-proj");
		const res = await DELETE(req, ctx);
		expect(res.status).toBe(404);
	});

	it("returns 502 when Cosmos throws a non-NotFoundOrForbiddenError error", async () => {
		mockDeleteProject.mockRejectedValue(new Error("gone"));
		const [req, ctx] = makeRequest("proj-1");
		expect((await DELETE(req, ctx)).status).toBe(502);
	});

	it("returns 403 when the user has no tenant_id", async () => {
		mockGetUser.mockResolvedValue({ ...AUTHED_USER, tenant_id: null });
		const [req, ctx] = makeRequest("proj-1");
		const res = await DELETE(req, ctx);
		expect(res.status).toBe(403);
		expect(mockDeleteProject).not.toHaveBeenCalled();
	});

	it("propagates IdentityError status (401 → 401)", async () => {
		mockGetUser.mockRejectedValue(new MockIdentityError("Unauthorized", 401));
		const [req, ctx] = makeRequest("proj-1");
		const res = await DELETE(req, ctx);
		expect(res.status).toBe(401);
		expect((await res.json()).error).toBe("Unauthorized");
	});

	it("propagates non-401 IdentityError status unchanged", async () => {
		mockGetUser.mockRejectedValue(new MockIdentityError("Session expired", 403));
		const [req, ctx] = makeRequest("proj-1");
		expect((await DELETE(req, ctx)).status).toBe(403);
	});

	it("returns 500 when Cosmos is not configured (fromEnv throws)", async () => {
		mockFromEnv.mockImplementationOnce(() => {
			throw new Error("COSMOS_ENDPOINT and COSMOS_KEY must be set");
		});
		const [req, ctx] = makeRequest("proj-1");
		expect((await DELETE(req, ctx)).status).toBe(500);
	});

	it("does not call deleteProject when projectId is missing", async () => {
		// Simulate an empty projectId (edge case: route matched but param empty)
		const [req, _ctx] = makeRequest("");
		const ctx = { params: Promise.resolve({ projectId: "" }) };
		const res = await DELETE(req, ctx);
		expect(res.status).toBe(400);
		expect(mockDeleteProject).not.toHaveBeenCalled();
	});
});
