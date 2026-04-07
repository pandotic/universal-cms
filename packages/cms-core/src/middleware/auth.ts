import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CmsRole } from "../config";

/**
 * Verify the current user has an admin-level role.
 *
 * Reads the Supabase auth session, then checks the `profiles` table
 * for the user's role. Returns `null` if authorized, or an error
 * `NextResponse` (401/403) if not.
 *
 * @param client  - Supabase client (use a server client with cookie access)
 * @param request - The incoming Next.js request (unused today but available for IP logging etc.)
 * @param allowedRoles - Roles that are authorized. Defaults to ["admin", "editor", "moderator"].
 */
export async function requireAdmin(
  client: SupabaseClient,
  _request: NextRequest,
  allowedRoles: CmsRole[] = ["admin", "editor", "moderator"]
): Promise<NextResponse | null> {
  try {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 403 }
      );
    }

    if (!allowedRoles.includes(profile.role as CmsRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return null; // authorized
  } catch {
    return NextResponse.json(
      { error: "Authentication check failed" },
      { status: 500 }
    );
  }
}

/**
 * Convert an unknown error into a JSON error response.
 */
export function apiError(e: unknown, status = 500): NextResponse {
  const message = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: message }, { status });
}
