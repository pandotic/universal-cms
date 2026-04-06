import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getEntitySourceMap } from "@/lib/data/entity-source-map";
import { requireAdmin, apiError } from "@/lib/api/auth";

interface DataForSEOItem {
  type?: string;
  rating?: {
    value?: number | string;
    votes_count?: number;
  };
  items?: DataForSEOItem[];
}

interface SourceConfig {
  source_name: string;
  source_url: string;
  search_query_footprint?: string;
  app_store_id?: string;
}

function getQuarterLabel(date: Date): string {
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `${date.getFullYear()}-Q${quarter}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findRating(items: DataForSEOItem[]): { score: number; reviewCount: number } | null {
  for (const item of items) {
    if (item.rating && item.rating.value != null) {
      const score = parseFloat(String(item.rating.value));
      const reviewCount = item.rating.votes_count ?? 0;
      if (!isNaN(score) && score > 0 && score <= 5) {
        return { score, reviewCount };
      }
    }
    if (item.items) {
      const nested = findRating(item.items);
      if (nested) return nested;
    }
  }
  return null;
}

async function fetchFromSerp(
  slug: string,
  config: SourceConfig
): Promise<{ average_score: number; review_count: number } | null> {
  const auth = process.env.DATAFORSEO_AUTH;
  if (!auth || !config.search_query_footprint) return null;

  const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        keyword: config.search_query_footprint,
        language_code: "en",
        location_code: 2840,
        depth: 10,
      },
    ]),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (data.status_code !== 20000) return null;

  const task = data.tasks?.[0];
  if (!task?.result?.[0]?.items) return null;

  const rating = findRating(task.result[0].items);
  if (!rating) return null;

  return { average_score: rating.score, review_count: rating.reviewCount };
}

async function fetchFromTrustpilot(
  config: SourceConfig
): Promise<{ average_score: number; review_count: number } | null> {
  try {
    const res = await fetch(config.source_url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ESGsource/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;
    const ld = JSON.parse(match[1]);
    if (ld?.aggregateRating) {
      return {
        average_score: parseFloat(ld.aggregateRating.ratingValue),
        review_count: parseInt(ld.aggregateRating.reviewCount, 10),
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchFromAppStore(
  config: SourceConfig
): Promise<{ average_score: number; review_count: number } | null> {
  if (!config.app_store_id) return null;
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${config.app_store_id}&country=us`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const app = data.results?.[0];
    if (!app?.averageUserRating) return null;
    return {
      average_score: Math.round(app.averageUserRating * 10) / 10,
      review_count: app.userRatingCount || 0,
    };
  } catch {
    return null;
  }
}

async function fetchSource(
  slug: string,
  config: SourceConfig
): Promise<{ average_score: number; review_count: number } | null> {
  switch (config.source_name) {
    case "trustpilot":
      return fetchFromTrustpilot(config);
    case "apple-app-store":
      return fetchFromAppStore(config);
    default:
      return fetchFromSerp(slug, config);
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const supabase = getSupabaseAdmin();
    const quarterLabel = getQuarterLabel(new Date());
    const snapshotDate = new Date().toISOString().split("T")[0];

    const entityMap = await getEntitySourceMap();
    const slugs = Object.keys(entityMap);
    const details: string[] = [];
    let succeeded = 0;
    let skipped = 0;
    let failed = 0;

    for (const slug of slugs) {
      const sources = entityMap[slug];

      const { data: platform } = await supabase
        .from("platforms")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!platform) {
        details.push(`${slug}: not in platforms table (run seed:platforms)`);
        failed++;
        continue;
      }

      for (const sourceConfig of sources) {
        try {
          const result = await fetchSource(slug, sourceConfig);

          if (!result) {
            details.push(`${slug}/${sourceConfig.source_name}: skipped (no data)`);
            skipped++;
            continue;
          }

          await supabase.from("review_sources").upsert(
            {
              platform_id: platform.id,
              source_name: sourceConfig.source_name,
              source_url: sourceConfig.source_url,
              search_query_footprint: sourceConfig.search_query_footprint || null,
            },
            { onConflict: "platform_id,source_name" }
          );

          const { error } = await supabase.from("rating_history_logs").insert({
            platform_id: platform.id,
            source_name: sourceConfig.source_name,
            average_score: result.average_score,
            review_count: result.review_count,
            snapshot_date: snapshotDate,
            quarter_label: quarterLabel,
          });

          if (error) {
            details.push(`${slug}/${sourceConfig.source_name}: DB error — ${error.message}`);
            failed++;
          } else {
            details.push(
              `${slug}/${sourceConfig.source_name}: ${result.average_score} (${result.review_count} reviews)`
            );
            succeeded++;
          }
        } catch (err) {
          details.push(`${slug}/${sourceConfig.source_name}: error — ${err}`);
          failed++;
        }

        await sleep(200);
      }
    }

    return NextResponse.json({ succeeded, skipped, failed, details });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
