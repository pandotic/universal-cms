import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@pandotic/universal-cms/admin/rbac";
import type { SupabaseClientAdapter } from "@pandotic/universal-cms/admin/types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * API middleware for platform admin role check.
 * Uses admin-core RBAC system with fallback to hub_role for backward compatibility.
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

  const isAdmin = await isPlatformAdmin(supabase as unknown as SupabaseClientAdapter, userId);

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
 * Helper to get current user ID from Supabase client.
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
