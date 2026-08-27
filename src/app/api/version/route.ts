import { NextResponse } from "next/server";
import { NO_CACHE_HEADERS } from "@/lib/cache-control";

export async function GET() {
	const version =
		process.env.BUILD_ID ??
		process.env.NEXT_PUBLIC_BUILD_ID ??
		process.env.VERCEL_GIT_COMMIT_SHA ??
		process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
		"dev";

	return NextResponse.json(
		{ version },
		{
			headers: NO_CACHE_HEADERS,
		}
	);
}
