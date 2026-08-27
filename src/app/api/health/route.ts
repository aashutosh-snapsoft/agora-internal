import { NextResponse } from "next/server";
import { FinancialModelsContainer } from "@/server/cosmos/financialModels";
import { NO_CACHE_HEADERS } from "@/lib/cache-control";

export const runtime = "nodejs";

/**
 * Backend liveness probe consumed by the client health controller
 * (checkBackend → degraded overlay when this is not ok).
 *
 * Probes COSMOS — the canonical store for the projects directory — NOT Hasura.
 * Hasura is being decommissioned; gating the whole (Cosmos-backed) app on a
 * Hasura ping meant a Hasura outage blanked the UI with "trouble connecting"
 * even though the directory reads from Cosmos. Hasura-dependent features
 * (documents, uploads, validation, financial tables) still surface their own
 * failures at point-of-use; they should not take down app-wide liveness.
 */
export async function GET() {
	try {
		const container = FinancialModelsContainer.fromEnv();
		await container.ping();

		const res = NextResponse.json({ ok: true });
		for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
			res.headers.set(key, value);
		}
		return res;
	} catch (err) {
		// Log the full error (not just .message) so prod logs carry the stack —
		// lets operators tell apart Cosmos unreachable, bad credentials, and
		// missing COSMOS_ENDPOINT/COSMOS_KEY (fromEnv() throws on the last).
		console.error("[/api/health] Cosmos ping failed", err);
		const res = NextResponse.json(
			{ ok: false, error: "Data store unavailable" },
			{ status: 503 }
		);
		for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
			res.headers.set(key, value);
		}
		return res;
	}
}
