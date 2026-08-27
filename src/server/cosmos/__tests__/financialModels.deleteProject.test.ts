/**
 * Unit tests for FinancialModelsContainer.deleteProject
 *
 * Mocks @azure/cosmos at the module level (same pattern as financialModels.test.ts).
 * Each test controls `mockItemRead` and `mockItemPatch` to simulate Cosmos
 * responses; the real ownership / guard logic in financialModels.ts is exercised
 * without any network calls.
 */

// ── Cosmos mock ──────────────────────────────────────────────────────────────
const mockItemPatch = jest.fn();
const mockItemRead = jest.fn();
// item() returns a fresh object each call; the methods are shared mocks.
const mockItem = jest.fn().mockReturnValue({
	read: mockItemRead,
	patch: mockItemPatch,
});
const mockQueryFetchAll = jest.fn();
const mockQuery = jest.fn().mockReturnValue({ fetchAll: mockQueryFetchAll });
const mockContainer = {
	items: { query: mockQuery },
	item: mockItem,
};
const mockDb = { container: jest.fn().mockReturnValue(mockContainer) };
const mockClientInstance = { database: jest.fn().mockReturnValue(mockDb) };

jest.mock("@azure/cosmos", () => ({
	CosmosClient: jest.fn().mockImplementation(() => mockClientInstance),
}));

import { FinancialModelsContainer, NotFoundOrForbiddenError } from "../financialModels";

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE_DOC = {
	id: "proj-1",
	project_id: "proj-1",
	tenant_id: "tenant-1",
	owner_user_id: "auth0|owner",
	document_type: "financial_model",
	status: "complete",
} as const;

const DELETE_ARGS = {
	projectId: "proj-1",
	tenantId: "tenant-1",
	ownerUserId: "auth0|owner",
} as const;

function makeContainer(): FinancialModelsContainer {
	// Clear the dev singleton so each test gets a fresh instance.
	delete (globalThis as { __cosmos?: unknown }).__cosmos;
	return FinancialModelsContainer.fromEnv();
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
	jest.clearAllMocks();
	process.env.COSMOS_ENDPOINT = "https://localhost:8081";
	process.env.COSMOS_KEY = "test-key";
	// Default: successful read of a valid owner doc.
	mockItemRead.mockResolvedValue({ resource: { ...BASE_DOC } });
	mockItemPatch.mockResolvedValue({});
	mockQueryFetchAll.mockResolvedValue({ resources: [] });
	delete (globalThis as { __cosmos?: unknown }).__cosmos;
});

afterEach(() => {
	delete process.env.COSMOS_ENDPOINT;
	delete process.env.COSMOS_KEY;
	delete (globalThis as { __cosmos?: unknown }).__cosmos;
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("deleteProject — ownership checks", () => {
	it("calls patch with 3 ops (deleted_at, deleted_by, status) for the project owner via owner_user_id", async () => {
		await makeContainer().deleteProject(DELETE_ARGS);
		expect(mockItemPatch).toHaveBeenCalledTimes(1);
		const [ops] = mockItemPatch.mock.calls[0] as [Array<{ op: string; path: string; value: unknown }>];
		expect(ops).toHaveLength(3);
		expect(ops).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ op: "add", path: "/deleted_at" }),
				expect.objectContaining({ op: "add", path: "/deleted_by", value: "auth0|owner" }),
				expect.objectContaining({ op: "add", path: "/status", value: "deleted" }),
			]),
		);
	});

	it("calls patch when ownership is via acl.owners (not owner_user_id)", async () => {
		mockItemRead.mockResolvedValue({
			resource: {
				...BASE_DOC,
				owner_user_id: undefined,
				acl: { owners: ["auth0|owner"] },
			},
		});
		await makeContainer().deleteProject(DELETE_ARGS);
		expect(mockItemPatch).toHaveBeenCalledTimes(1);
	});

	it("throws NotFoundOrForbiddenError for a cross-tenant doc (patch not called)", async () => {
		mockItemRead.mockResolvedValue({
			resource: { ...BASE_DOC, tenant_id: "other-tenant" },
		});
		await expect(makeContainer().deleteProject(DELETE_ARGS)).rejects.toBeInstanceOf(
			NotFoundOrForbiddenError,
		);
		expect(mockItemPatch).not.toHaveBeenCalled();
	});

	it("throws NotFoundOrForbiddenError when caller is not the owner (patch not called)", async () => {
		mockItemRead.mockResolvedValue({
			resource: { ...BASE_DOC, owner_user_id: "auth0|someone-else" },
		});
		await expect(
			makeContainer().deleteProject({ ...DELETE_ARGS, ownerUserId: "auth0|intruder" }),
		).rejects.toBeInstanceOf(NotFoundOrForbiddenError);
		expect(mockItemPatch).not.toHaveBeenCalled();
	});
});

describe("deleteProject — document_type guard", () => {
	it("throws NotFoundOrForbiddenError when document_type is not 'financial_model'", async () => {
		mockItemRead.mockResolvedValue({
			resource: { ...BASE_DOC, document_type: "workspace" },
		});
		await expect(makeContainer().deleteProject(DELETE_ARGS)).rejects.toBeInstanceOf(
			NotFoundOrForbiddenError,
		);
		expect(mockItemPatch).not.toHaveBeenCalled();
	});

	it("throws NotFoundOrForbiddenError when document_type is absent", async () => {
		const { document_type: _dt, ...docWithoutType } = BASE_DOC;
		mockItemRead.mockResolvedValue({ resource: docWithoutType });
		await expect(makeContainer().deleteProject(DELETE_ARGS)).rejects.toBeInstanceOf(
			NotFoundOrForbiddenError,
		);
		expect(mockItemPatch).not.toHaveBeenCalled();
	});
});

describe("deleteProject — idempotency", () => {
	it("does NOT call patch when the doc is already soft-deleted (deleted_at set)", async () => {
		mockItemRead.mockResolvedValue({
			resource: { ...BASE_DOC, deleted_at: "2026-01-01T00:00:00.000Z" },
		});
		// Should resolve without error and without patching
		await expect(makeContainer().deleteProject(DELETE_ARGS)).resolves.toBeUndefined();
		expect(mockItemPatch).not.toHaveBeenCalled();
	});
});

describe("deleteProject — Cosmos read failures", () => {
	it("throws NotFoundOrForbiddenError when Cosmos read returns null resource", async () => {
		mockItemRead.mockResolvedValue({ resource: null });
		await expect(makeContainer().deleteProject(DELETE_ARGS)).rejects.toBeInstanceOf(
			NotFoundOrForbiddenError,
		);
		expect(mockItemPatch).not.toHaveBeenCalled();
	});

	it("throws NotFoundOrForbiddenError when Cosmos read throws with code 404", async () => {
		mockItemRead.mockRejectedValue(Object.assign(new Error("Not Found"), { code: 404 }));
		await expect(makeContainer().deleteProject(DELETE_ARGS)).rejects.toBeInstanceOf(
			NotFoundOrForbiddenError,
		);
		expect(mockItemPatch).not.toHaveBeenCalled();
	});

	it("throws NotFoundOrForbiddenError when Cosmos read throws with string code '404'", async () => {
		mockItemRead.mockRejectedValue(Object.assign(new Error("Not Found"), { code: "404" }));
		await expect(makeContainer().deleteProject(DELETE_ARGS)).rejects.toBeInstanceOf(
			NotFoundOrForbiddenError,
		);
		expect(mockItemPatch).not.toHaveBeenCalled();
	});

	it("re-throws non-404 Cosmos errors unchanged", async () => {
		const networkErr = new Error("ECONNREFUSED");
		mockItemRead.mockRejectedValue(networkErr);
		await expect(makeContainer().deleteProject(DELETE_ARGS)).rejects.toThrow("ECONNREFUSED");
	});
});
