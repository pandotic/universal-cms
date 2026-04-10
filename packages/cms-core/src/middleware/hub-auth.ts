import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { HubRole } from "../types/hub";

/**
 * Verify the current user has an authorized Hub role.
 *
 * Reads the Supabase auth session, then checks the `hub_users` table
 * for the user's hub_role. Returns `null` if authorized, or an error
 * `NextResponse` (401/403) if not.
 *
 * @param client  - Supabase client (use a server client with cookie access)
 * @param _request - The incoming Next.js request
 * @param allowedRoles - Hub roles that are authorized
 */
export async function requireHubRole(
  client: SupabaseClient,
  _request: NextRequest,
  allowedRoles: HubRole[] = ["super_admin", "group_admin", "member"]
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

    const { data: hubUser, error: userError } = await client
      .from("hub_users")
      .select("hub_role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (userError) {
      return NextResponse.json(
        { error: "Failed to check hub user" },
        { status: 500 }
      );
    }

    // If no hub_users row exists, treat as viewer (lowest role)
    const role: HubRole = hubUser?.hub_role ?? "viewer";

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Insufficient hub permissions" },
        { status: 403 }
      );
    }

    return null; // authorized
  } catch {
    return NextResponse.json(
      { error: "Hub authentication check failed" },
      { status: 500 }
    );
  }
}
