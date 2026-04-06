import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const supabase = await getSupabaseAdmin();

    const [pagesRes, mediaRes, usersRes, activityRes] = await Promise.all([
      supabase.from("content_pages").select("id", { count: "exact", head: true }),
      supabase.from("content_media").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
      supabase
        .from("activity_log")
        .select("id, user_id, action, entity_type, entity_title, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return NextResponse.json({
      data: {
        contentPages: pagesRes.count ?? 0,
        mediaFiles: mediaRes.count ?? 0,
        activeUsers: usersRes.count ?? 0,
        recentActivity: activityRes.data ?? [],
        recentActivityCount: activityRes.data?.length ?? 0,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
