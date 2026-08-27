"use client";

/**
 * Browser-side blob access for the demo self-service file browser (contract D3).
 *
 * Every function is constructed from the container SAS URL ONLY — the exact
 * `container.sas_url` the demo page already holds. The browser NEVER sees an
 * account key, connection string, or any credential: `new ContainerClient(sasUrl)`
 * takes the SAS URL as its sole argument (the SAS *is* the capability). The SAS is
 * user-delegation signed and scoped to `rwlc` (read+write+list+create, no delete)
 * by the server (`azure-blob-keyless.ts`); these helpers only exercise it.
 *
 * A 403 (expired / rejected SAS) is surfaced as a catchable {@link SasAccessError}
 * so the UI can prompt the user to reopen the project rather than failing silently.
 */

import { ContainerClient } from "@azure/storage-blob";

/** One blob as shown in the file browser. */
export interface BlobEntry {
	name: string;
	size: number;
	lastModified?: Date;
}

/**
 * Raised when the SAS is rejected by Azure Storage (HTTP 403) — typically an
 * expired short-lived SAS. Catchable by the UI to show a "reopen the project"
 * message instead of a raw SDK error.
 */
export class SasAccessError extends Error {
	constructor(
		message: string,
		readonly cause?: unknown,
	) {
		super(message);
		this.name = "SasAccessError";
	}
}

/**
 * Build a container client from the SAS URL alone. No credential/key argument is
 * ever passed — keeping the browser keyless is the whole point of the SAS posture.
 */
function containerFromSas(sasUrl: string): ContainerClient {
	return new ContainerClient(sasUrl);
}

/** True when the SDK error carries an HTTP 403 (SAS rejected / expired). */
function isForbidden(err: unknown): boolean {
	return (err as { statusCode?: number } | null)?.statusCode === 403;
}

/** Translate a 403 into a clear, catchable {@link SasAccessError}; rethrow anything else. */
function rethrowSasError(err: unknown): never {
	if (isForbidden(err)) {
		throw new SasAccessError(
			"Your demo session expired. Reopen the project to continue.",
			err,
		);
	}
	throw err;
}

/**
 * List the blobs in the container the SAS grants access to.
 * @returns each blob as `{ name, size, lastModified }`.
 */
export async function listFiles(sasUrl: string): Promise<BlobEntry[]> {
	const container = containerFromSas(sasUrl);
	try {
		const entries: BlobEntry[] = [];
		for await (const blob of container.listBlobsFlat()) {
			entries.push({
				name: blob.name,
				size: blob.properties.contentLength ?? 0,
				lastModified: blob.properties.lastModified,
			});
		}
		return entries;
	} catch (err) {
		rethrowSasError(err);
	}
}

/**
 * Upload a browser `File` straight into the container via the SAS (no server hop).
 * Uses the block-blob upload path; the file's MIME type is preserved on the blob.
 */
export async function uploadFile(sasUrl: string, file: File): Promise<void> {
	const container = containerFromSas(sasUrl);
	try {
		const blockBlob = container.getBlockBlobClient(file.name);
		await blockBlob.uploadData(file, {
			blobHTTPHeaders: {
				blobContentType: file.type || "application/octet-stream",
			},
		});
	} catch (err) {
		rethrowSasError(err);
	}
}

/**
 * Build a direct download URL for a blob by inserting its name into the SAS URL's
 * path and reusing the SAS query string. A plain anchor (`<a download href=…>`)
 * pointed at this URL streams the blob directly from Storage — no in-memory
 * buffering, no credential, just the SAS the caller already holds.
 */
export function downloadUrl(sasUrl: string, blobName: string): string {
	const url = new URL(sasUrl);
	const base = url.pathname.replace(/\/+$/, "");
	const encodedBlob = blobName
		.split("/")
		.map(encodeURIComponent)
		.join("/");
	url.pathname = `${base}/${encodedBlob}`;
	// url.search (the SAS token) is preserved verbatim by toString().
	return url.toString();
}
