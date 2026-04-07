import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
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
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
