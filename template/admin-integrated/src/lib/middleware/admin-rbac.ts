import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@pandotic/admin-core/rbac";
import type { SupabaseClientAdapter } from "@pandotic/admin-core/types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * API middleware for platform admin role check.
 * Uses admin-core RBAC system to verify user is platform admin.
 *
 * Usage in API route:
 * ```typescript
 * export async function PUT(request: Request) {
 *   const supabase = createClient();
 *   const userId = await getCurrentUserId(supabase);
 *   const authError = await requirePlatformAdmin(supabase, userId);
 *   if (authError) return authError; // User not authorized
 *   // Proceed with admin operation...
 * }
 * ```
 */
export async function requirePlatformAdmin(
  supabase: SupabaseClient,
  userId?: string
): Promise<NextResponse | null> {
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized: User ID required" },
      { status: 401 }
    );
  }

  const isAdmin = await isPlatformAdmin(
    supabase as unknown as SupabaseClientAdapter,
    userId
  );

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden: Platform admin access required" },
      { status: 403 }
    );
  }

  // User is authorized, return null to indicate no error
  return null;
}

/**
 * Get current user ID from Supabase auth.
 * Returns null if user is not authenticated.
 */
export async function getCurrentUserId(
  supabase: SupabaseClient | SupabaseClientAdapter
): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
