import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin, apiError } from "@/lib/api/auth";

interface SourceMetrics {
  current_score: number;
  total_reviews: number;
  score_delta: number | null;
  review_velocity: number | null;
  trend_direction: "up" | "down" | "flat";
  url: string;
}

interface EntityRatings {
  platform_slug: string;
  last_updated: string;
  aggregate_metrics: Record<string, SourceMetrics>;
}

function getQuarterLabel(date: Date): string {
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `${date.getFullYear()}-Q${quarter}`;
}

function getPreviousQuarterLabel(currentLabel: string): string {
  const [yearStr, qStr] = currentLabel.split("-Q");
  let year = parseInt(yearStr, 10);
  let quarter = parseInt(qStr, 10) - 1;
  if (quarter === 0) {
    quarter = 4;
    year--;
  }
  return `${year}-Q${quarter}`;
}

function computeTrend(
  currentScore: number | null,
  previousScore: number | null
): { score_delta: number | null; trend_direction: "up" | "down" | "flat" } {
  if (currentScore === null || previousScore === null) {
    return { score_delta: null, trend_direction: "flat" };
  }
  const delta = Math.round((currentScore - previousScore) * 100) / 100;
  let trend_direction: "up" | "down" | "flat" = "flat";
  if (delta > 0.05) trend_direction = "up";
  else if (delta < -0.05) trend_direction = "down";
  return { score_delta: delta, trend_direction };
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const supabase = getSupabaseAdmin();
    const currentQuarter = getQuarterLabel(new Date());
    const previousQuarter = getPreviousQuarterLabel(currentQuarter);

    const { data: platforms } = await supabase
      .from("platforms")
      .select("id, slug");

    if (!platforms) {
      return NextResponse.json({ error: "Failed to fetch platforms" }, { status: 500 });
    }

    const { data: currentRatings } = await supabase
      .from("rating_history_logs")
      .select("platform_id, source_name, average_score, review_count, snapshot_date")
      .eq("quarter_label", currentQuarter)
      .order("snapshot_date", { ascending: false });

    const { data: previousRatings } = await supabase
      .from("rating_history_logs")
      .select("platform_id, source_name, average_score, review_count")
      .eq("quarter_label", previousQuarter)
      .order("snapshot_date", { ascending: false });

    const { data: reviewSources } = await supabase
      .from("review_sources")
      .select("platform_id, source_name, source_url");

    const platformSlugMap = new Map(platforms.map((p) => [p.id, p.slug]));

    type RatingRow = {
      platform_id: string;
      source_name: string;
      average_score: number | null;
      review_count: number | null;
      snapshot_date?: string;
    };

    function dedup(rows: RatingRow[] | null): Map<string, RatingRow> {
      const map = new Map<string, RatingRow>();
      for (const row of rows || []) {
        const key = `${row.platform_id}:${row.source_name}`;
        if (!map.has(key)) map.set(key, row);
      }
      return map;
    }

    const currentMap = dedup(currentRatings);
    const previousMap = dedup(previousRatings);

    const sourceUrlMap = new Map<string, string>();
    for (const src of reviewSources || []) {
      sourceUrlMap.set(`${src.platform_id}:${src.source_name}`, src.source_url || "");
    }

    const output: Record<string, EntityRatings> = {};

    for (const [key, current] of currentMap) {
      const slug = platformSlugMap.get(current.platform_id);
      if (!slug) continue;

      if (!output[slug]) {
        output[slug] = {
          platform_slug: slug,
          last_updated: current.snapshot_date || new Date().toISOString().split("T")[0],
          aggregate_metrics: {},
        };
      }

      const previous = previousMap.get(key);
      const { score_delta, trend_direction } = computeTrend(
        current.average_score,
        previous?.average_score ?? null
      );

      const reviewVelocity =
        current.review_count !== null && previous?.review_count !== null
          ? current.review_count - (previous?.review_count ?? 0)
          : null;

      output[slug].aggregate_metrics[current.source_name] = {
        current_score: current.average_score ?? 0,
        total_reviews: current.review_count ?? 0,
        score_delta,
        review_velocity: reviewVelocity,
        trend_direction,
        url: sourceUrlMap.get(key) || "",
      };
    }

    const outputPath = path.resolve("src/data/ratings.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");

    return NextResponse.json({
      entityCount: Object.keys(output).length,
      path: outputPath,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
