import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getUserFromSessionOrThrow, IdentityError } from "@/lib/identity";
import { NO_CACHE_HEADERS, CLEAR_SITE_DATA_HEADERS } from "@/lib/cache-control";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth0.getSession(req);

    if (!session?.user?.sub) {
      const res = NextResponse.json(
        { authenticated: false, identityResolved: false, error: "Unauthorized" },
        { status: 401 }
      );
      for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
        res.headers.set(key, value);
      }
      for (const [key, value] of Object.entries(CLEAR_SITE_DATA_HEADERS)) {
        res.headers.set(key, value);
      }
      return res;
    }

    const resolveIdentityWithRetry = async (attempts: number) => {
      let lastError: unknown = null;
      for (let i = 0; i < attempts; i += 1) {
        try {
          return { user: await getUserFromSessionOrThrow(req), error: null };
        } catch (error) {
          lastError = error;
        }
      }
      return { user: null, error: lastError };
    };

    const { user, error } = await resolveIdentityWithRetry(2);

    if (user) {
      const res = NextResponse.json({
        authenticated: true,
        identityResolved: true,
        user,
        tenant_id: user.tenant_id,
      });
      for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
        res.headers.set(key, value);
      }
      return res;
    }

    if (error) {
      console.error("[/api/auth/me] Identity resolution failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const errorPayload =
      error instanceof IdentityError
        ? { message: error.message, details: error.details, status: error.status }
        : {
            message: "Failed to resolve user",
            details: error instanceof Error ? error.message : String(error),
          };

    const res = NextResponse.json({
      authenticated: true,
      identityResolved: false,
      error: errorPayload,
    });
    for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
      res.headers.set(key, value);
    }
    return res;
  } catch (error) {
    console.error("[/api/auth/me] Unexpected failure", {
      message: error instanceof Error ? error.message : String(error),
    });
    const res = NextResponse.json(
      { authenticated: false, identityResolved: false, error: "Unauthorized" },
      { status: 401 }
    );
    for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
      res.headers.set(key, value);
    }
    for (const [key, value] of Object.entries(CLEAR_SITE_DATA_HEADERS)) {
      res.headers.set(key, value);
    }
    return res;
  }
}
