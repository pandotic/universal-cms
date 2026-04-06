import { NextRequest, NextResponse } from "next/server";
import { getClickStats } from "@/lib/data/click-analytics";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "30", 10);

    const stats = await getClickStats({ days });

    // Fetch top clicked links with details
    const supabase = await getSupabaseAdmin();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: topLinks } = await supabase
      .from("outbound_clicks")
      .select(`
        link_id,
        clicked_at,
        outbound_links!inner (
          id,
          url,
          label,
          placement
        )
      `)
      .gte("clicked_at", since.toISOString())
      .order("clicked_at", { ascending: false })
      .limit(200);

    // Aggregate clicks by link
    const linkMap = new Map<string, {
      id: string;
      url: string;
      label: string | null;
      placement: string | null;
      clickCount: number;
      lastClicked: string;
    }>();

    for (const click of topLinks ?? []) {
      const link = click.outbound_links as unknown as {
        id: string;
        url: string;
        label: string | null;
        placement: string | null;
      };
      if (!link) continue;

      const existing = linkMap.get(link.id);
      if (existing) {
        existing.clickCount++;
        if (click.clicked_at > existing.lastClicked) {
          existing.lastClicked = click.clicked_at;
        }
      } else {
        linkMap.set(link.id, {
          id: link.id,
          url: link.url,
          label: link.label,
          placement: link.placement,
          clickCount: 1,
          lastClicked: click.clicked_at,
        });
      }
    }

    const clicks = Array.from(linkMap.values())
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 20);

    // Find top placement
    const placementCounts = new Map<string, number>();
    for (const link of clicks) {
      const p = link.placement ?? "unknown";
      placementCounts.set(p, (placementCounts.get(p) ?? 0) + link.clickCount);
    }
    let topPlacement = "none";
    let maxCount = 0;
    for (const [p, count] of placementCounts) {
      if (count > maxCount) {
        topPlacement = p;
        maxCount = count;
      }
    }

    return NextResponse.json({
      data: {
        totalClicks: stats.totalClicks,
        uniqueLinks: stats.uniqueLinks,
        topPlacement,
        clicks,
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
