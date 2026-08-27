import { NextRequest, NextResponse } from "next/server";
import { getUserFromSessionOrThrow, IdentityError } from "@/lib/identity";
import { getPool } from "@/server/db/client";

export const runtime = "nodejs";

// Allowlist: only user-editable display fields. Extend here + in the thunk body together.
// Two callers share this route (tracked transitional state — SENG-870):
//   • BasicInformation  → first_name / last_name / title
//   • AvatarProvider / useAvatarManager → image_url
const ALLOWED_FIELDS = ["first_name", "last_name", "title", "image_url"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

interface ProfileUpdateBody {
  first_name?: string | null;
  last_name?: string | null;
  title?: string | null;
  image_url?: string | null;
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromSessionOrThrow(req);

    let body: ProfileUpdateBody;
    try {
      body = (await req.json()) as ProfileUpdateBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updates: Partial<Record<AllowedField, string | null>> = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) updates[field] = body[field] ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const keys = Object.keys(updates) as AllowedField[];
    // $1 = user.id, $2 = tenant_id (WHERE clause); field values start at $3.
    const setClauses = keys.map((key, i) => `${key} = $${i + 3}`).join(", ");
    const values: (string | null)[] = [user.id, user.tenant_id!, ...keys.map((k) => updates[k] ?? null)];

    const result = await getPool().query(
      `UPDATE users SET ${setClauses} WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      values,
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ id: result.rows[0].id as string });
  } catch (e) {
    if (e instanceof IdentityError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[/api/auth/profile] Error:", detail);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
