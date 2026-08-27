// Unit tests for the browser blob client in src/lib/projects/blob-browser-client.ts
// (promoted from src/lib/demo/ — SCS-110/PR #569). These lock the KEYLESS posture
// of the browser surface: the
// @azure/storage-blob ContainerClient must be constructed from the SAS URL ONLY
// (no key/credential/connection-string), and list/upload must drive the SDK.
//
// @azure/storage-blob is mocked so the test is self-contained and needs no network
// or real SAS (same mock-the-SDK approach as the sibling azure-blob-keyless.test.ts).

import { ContainerClient } from "@azure/storage-blob";
import {
	downloadUrl,
	listFiles,
	SasAccessError,
	uploadFile,
} from "../blob-browser-client";

jest.mock("@azure/storage-blob", () => ({
	ContainerClient: jest.fn(),
}));

// The mocked constructor — we assert on how it is *called* (SAS URL only).
const MockedContainerClient = ContainerClient as unknown as jest.Mock;

// A representative container SAS URL: path is the container, query is the SAS token.
const SAS_URL =
	"https://agorademodev.blob.core.windows.net/demo-abc123-20260701000000" +
	"?sv=2020-02-10&sp=rwlc&spr=https&sig=FAKESIGNATURE%3D%3D";

interface ContainerMock {
	listBlobsFlat: jest.Mock;
	getBlockBlobClient: jest.Mock;
	uploadData: jest.Mock;
}

/** Build a ContainerClient test double with sensible empty defaults. */
function makeContainerMock(overrides: Partial<ContainerMock> = {}): ContainerMock {
	const uploadData = jest.fn().mockResolvedValue(undefined);
	const getBlockBlobClient = jest.fn(() => ({ uploadData }));
	async function* noBlobs(): AsyncGenerator<never> {
		// no blobs
	}
	const listBlobsFlat = jest.fn(() => noBlobs());
	return { listBlobsFlat, getBlockBlobClient, uploadData, ...overrides };
}

beforeEach(() => {
	MockedContainerClient.mockReset();
});

describe("blob-browser-client — SAS-URL-only browser blob access (D3)", () => {
	// The named failing-then-passing test the PR cites: before this module existed
	// the import (and this assertion) could not resolve; it is green now that the
	// client constructs ContainerClient from the SAS URL and nothing else.
	it("constructs ContainerClient from the SAS URL only — no key/credential arg", async () => {
		const impl = makeContainerMock();
		MockedContainerClient.mockImplementation(() => impl);

		await listFiles(SAS_URL);

		expect(MockedContainerClient).toHaveBeenCalledTimes(1);
		expect(MockedContainerClient).toHaveBeenCalledWith(SAS_URL);
		// Exactly ONE argument — a credential/key would be a forbidden second arg.
		expect(MockedContainerClient.mock.calls[0]).toHaveLength(1);
	});

	it("listFiles maps listBlobsFlat() results to { name, size, lastModified }", async () => {
		const lastModified = new Date("2026-07-01T12:00:00Z");
		async function* blobs() {
			yield { name: "a.txt", properties: { contentLength: 12, lastModified } };
			yield { name: "sub/b.csv", properties: { contentLength: 34, lastModified } };
		}
		const impl = makeContainerMock({ listBlobsFlat: jest.fn(() => blobs()) });
		MockedContainerClient.mockImplementation(() => impl);

		const files = await listFiles(SAS_URL);

		expect(impl.listBlobsFlat).toHaveBeenCalledTimes(1);
		expect(files).toEqual([
			{ name: "a.txt", size: 12, lastModified },
			{ name: "sub/b.csv", size: 34, lastModified },
		]);
	});

	it("uploadFile uploads via getBlockBlobClient().uploadData with the file's content-type", async () => {
		const impl = makeContainerMock();
		MockedContainerClient.mockImplementation(() => impl);
		const file = { name: "report.pdf", type: "application/pdf" } as unknown as File;

		await uploadFile(SAS_URL, file);

		expect(impl.getBlockBlobClient).toHaveBeenCalledWith("report.pdf");
		expect(impl.uploadData).toHaveBeenCalledTimes(1);
		const [data, options] = impl.uploadData.mock.calls[0];
		expect(data).toBe(file);
		expect(options).toEqual({
			blobHTTPHeaders: { blobContentType: "application/pdf" },
		});
	});

	it("surfaces a catchable SasAccessError on a 403 (expired SAS)", async () => {
		// Intentional: an async iterator that throws on first pull (simulates a 403 when
		// listing blobs); it never yields — hence the require-yield suppression.
		// eslint-disable-next-line require-yield
		async function* throws403(): AsyncGenerator<never> {
			throw Object.assign(new Error("Server failed to authenticate"), {
				statusCode: 403,
			});
		}
		const impl = makeContainerMock({ listBlobsFlat: jest.fn(() => throws403()) });
		MockedContainerClient.mockImplementation(() => impl);

		await expect(listFiles(SAS_URL)).rejects.toBeInstanceOf(SasAccessError);
	});

	it("downloadUrl inserts the blob name into the SAS path and reuses the SAS query string", () => {
		const url = downloadUrl(SAS_URL, "sub dir/out put.txt");
		const parsed = new URL(url);

		// Blob name inserted after the container, path-segment encoded.
		expect(parsed.pathname).toBe(
			"/demo-abc123-20260701000000/sub%20dir/out%20put.txt",
		);
		// SAS token carried through unchanged (no re-signing, no credential).
		expect(parsed.searchParams.get("sig")).toBe("FAKESIGNATURE==");
		expect(parsed.searchParams.get("sp")).toBe("rwlc");
	});
});
