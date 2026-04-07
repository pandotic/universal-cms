import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@pandotic/universal-cms/middleware";

export async function GET(request: NextRequest) {
  const authClient = await createClient();
  const authError = await requireAdmin(authClient, request);
  if (authError) return authError;

  try {
    const supabase = await createAdminClient();

    const [pagesRes, mediaRes] = await Promise.all([
      supabase.from("content_pages").select("id", { count: "exact", head: true }),
      supabase.from("content_media").select("id", { count: "exact", head: true }),
    ]);

    const activityRes = await supabase
      .from("activity_log")
      .select("id, action, entity_type, entity_title, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      data: {
        contentPages: pagesRes.count ?? 0,
        mediaFiles: mediaRes.count ?? 0,
        activeUsers: 0,
        recentActivity: activityRes.data ?? [],
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
