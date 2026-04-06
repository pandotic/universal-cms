import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface OutboundLink {
  id: string;
  url: string;
  label: string | null;
  placement: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface OutboundClick {
  id: string;
  link_id: string;
  session_id: string | null;
  user_agent: string | null;
  referrer: string | null;
  ip_hash: string | null;
  clicked_at: string;
}

export interface ClickStats {
  totalClicks: number;
  uniqueLinks: number;
  topLinks: { url: string; label: string | null; clicks: number }[];
  clicksByPlacement: { placement: string; clicks: number }[];
  clicksByDay: { date: string; clicks: number }[];
}

export async function recordClick(data: {
  url: string;
  label?: string;
  placement?: string;
  entityType?: string;
  entityId?: string;
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
}): Promise<void> {
  const supabase = await getSupabaseAdmin();

  // Upsert the link
  const { data: link, error: linkError } = await supabase
    .from("outbound_links")
    .upsert(
      {
        url: data.url,
        label: data.label,
        placement: data.placement,
        entity_type: data.entityType,
        entity_id: data.entityId,
      },
      { onConflict: "url" }
    )
    .select("id")
    .single();

  if (linkError) {
    // If upsert fails, try to find existing
    const { data: existing } = await supabase
      .from("outbound_links")
      .select("id")
      .eq("url", data.url)
      .single();

    if (!existing) return;

    await supabase.from("outbound_clicks").insert({
      link_id: existing.id,
      session_id: data.sessionId,
      user_agent: data.userAgent,
      referrer: data.referrer,
    });
    return;
  }

  // Record the click
  await supabase.from("outbound_clicks").insert({
    link_id: link.id,
    session_id: data.sessionId,
    user_agent: data.userAgent,
    referrer: data.referrer,
  });
}

export async function getClickStats(options?: {
  days?: number;
  placement?: string;
}): Promise<ClickStats> {
  const supabase = await getSupabaseAdmin();
  const days = options?.days ?? 30;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  // Total clicks
  const { count: totalClicks } = await supabase
    .from("outbound_clicks")
    .select("*", { count: "exact", head: true })
    .gte("clicked_at", sinceStr);

  // Unique links clicked
  const { data: linksData } = await supabase
    .from("outbound_clicks")
    .select("link_id")
    .gte("clicked_at", sinceStr);

  const uniqueLinks = new Set(linksData?.map((d) => d.link_id)).size;

  // Top links
  let topLinksRaw: { url: string; label: string | null; click_count: number }[] | null = null;
  try {
    const { data } = await supabase.rpc("get_top_clicked_links", {
      since_date: sinceStr,
      result_limit: 10,
    });
    topLinksRaw = data;
  } catch {
    // RPC may not exist yet
  }

  const topLinks = (topLinksRaw ?? []).map(
    (r: { url: string; label: string | null; click_count: number }) => ({
      url: r.url,
      label: r.label,
      clicks: r.click_count,
    })
  );

  return {
    totalClicks: totalClicks ?? 0,
    uniqueLinks,
    topLinks,
    clicksByPlacement: [],
    clicksByDay: [],
  };
}
