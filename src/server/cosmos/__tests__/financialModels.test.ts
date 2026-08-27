// Mock @azure/cosmos before importing financialModels
const mockQueryFetchAll = jest.fn();
const mockQuery = jest.fn().mockReturnValue({ fetchAll: mockQueryFetchAll });
const mockContainer = { items: { query: mockQuery } };
const mockDb = { container: jest.fn().mockReturnValue(mockContainer) };
const mockClientInstance = { database: jest.fn().mockReturnValue(mockDb) };

jest.mock("@azure/cosmos", () => ({
	CosmosClient: jest.fn().mockImplementation(() => mockClientInstance),
}));

import { FinancialModelsContainer } from "../financialModels";

beforeEach(() => {
	jest.clearAllMocks();
	process.env.COSMOS_ENDPOINT = "https://localhost:8081";
	process.env.COSMOS_KEY = "test-key";
	mockQueryFetchAll.mockResolvedValue({ resources: [] });
	delete (globalThis as { __cosmos?: unknown }).__cosmos;
});

afterEach(() => {
	delete process.env.COSMOS_ENDPOINT;
	delete process.env.COSMOS_KEY;
	delete (globalThis as { __cosmos?: unknown }).__cosmos;
});

describe("listProjectsForUser", () => {
	it("filters by tenant, owner (acl.owners OR owner_user_id), and document_type", async () => {
		mockQueryFetchAll.mockResolvedValue({ resources: [] });
		await FinancialModelsContainer.fromEnv().listProjectsForUser({
			ownerUserId: "auth0|abc",
			tenantId: "tenant-1",
		});
		const [spec] = mockQuery.mock.calls[0];
		expect(spec.query).toMatch(/c\.tenant_id\s*=\s*@tenantId/);
		expect(spec.query).toMatch(/ARRAY_CONTAINS\(c\.acl\.owners,\s*@ownerUserId\)/);
		expect(spec.query).toMatch(/c\.owner_user_id\s*=\s*@ownerUserId/);
		expect(spec.query).toMatch(/document_type\s*=\s*"financial_model"/);
		expect(spec.parameters).toEqual(
			expect.arrayContaining([
				{ name: "@tenantId", value: "tenant-1" },
				{ name: "@ownerUserId", value: "auth0|abc" },
			]),
		);
	});

	it("returns the projected directory rows", async () => {
		const rows = [
			{
				id: "proj-1",
				project_id: "proj-1",
				status: "complete",
				updated_at: "2026-05-20T00:00:00Z",
				name: "Acme",
				sources: [{ filename: "fy24.xlsx" }],
			},
		];
		mockQueryFetchAll.mockResolvedValue({ resources: rows });
		const result = await FinancialModelsContainer.fromEnv().listProjectsForUser({
			ownerUserId: "auth0|abc",
			tenantId: "tenant-1",
		});
		expect(result).toEqual(rows);
	});

	it("returns [] when the user owns no projects", async () => {
		mockQueryFetchAll.mockResolvedValue({ resources: [] });
		const result = await FinancialModelsContainer.fromEnv().listProjectsForUser({
			ownerUserId: "auth0|none",
			tenantId: "tenant-1",
		});
		expect(result).toEqual([]);
	});
});

describe("fromEnv", () => {
	it("throws when COSMOS_ENDPOINT is missing", () => {
		delete process.env.COSMOS_ENDPOINT;
		expect(() => FinancialModelsContainer.fromEnv()).toThrow(
			"COSMOS_ENDPOINT and COSMOS_KEY must be set",
		);
	});

	it("reuses the same instance across calls in dev (no HMR leak)", () => {
		const a = FinancialModelsContainer.fromEnv();
		const b = FinancialModelsContainer.fromEnv();
		expect(a).toBe(b);
	});
});
