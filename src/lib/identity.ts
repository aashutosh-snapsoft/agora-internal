import { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { CLAIM_NS } from "@/lib/auth/identity-claims";

export type IdentityUser = {
  id: string;
  external_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  tenant_id: string | null;
  tenant: { display_label: string | null } | null;
};

export class IdentityError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status = 401, details?: string) {
    super(message);
    this.name = "IdentityError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Narrow a raw claim value to a non-empty string or undefined.
 *
 * The `as string` cast used elsewhere passes numbers and objects silently into
 * downstream headers. This guard rejects non-strings and empty strings so
 * callers get undefined rather than "0", "[object Object]", or "" flowing into
 * x-hasura-* headers and Cosmos params.
 */
function claimString(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}

export async function getUserFromSessionOrThrow(
  req: NextRequest
): Promise<IdentityUser> {
  const session = await auth0.getSession(req);

  if (!session?.user?.sub) {
    console.error("[identity] Missing Auth0 session");
    throw new IdentityError("Unauthorized", 401, "Missing Auth0 session");
  }

  const u = session.user as Record<string, unknown>;

  // Read identity from claims stamped by the "Stamp Identity Claims" Auth0
  // Action at login (SENG-776). No Hasura call — zero per-request DB lookup.
  // The beforeSessionSaved hook in auth0.ts ensures these survive the SDK's
  // default claim filter; if claims are absent the user must re-login.
  const user_id      = claimString(u[`${CLAIM_NS}/user_id`]);
  const tenant_id    = claimString(u[`${CLAIM_NS}/tenant_id`]);
  const tenant_label = claimString(u[`${CLAIM_NS}/tenant_label`]) ?? null;

  if (!user_id || !tenant_id) {
    console.error("[identity] Missing or invalid custom claims", {
      sub:           u.sub,
      has_user_id:   !!user_id,
      has_tenant_id: !!tenant_id,
    });
    throw new IdentityError(
      "Unauthorized",
      401,
      "Missing identity claims — ensure the Auth0 'Stamp Identity Claims' Action is deployed and the user has logged in since it was added"
    );
  }

  return {
    id:          user_id,
    external_id: String(u.sub),
    email:       typeof u.email        === "string" ? u.email        : null,
    first_name:  typeof u.given_name   === "string" ? u.given_name   : null,
    last_name:   typeof u.family_name  === "string" ? u.family_name  : null,
    image_url:   typeof u.picture      === "string" ? u.picture      : null,
    tenant_id,
    tenant:      { display_label: tenant_label },
  };
}
