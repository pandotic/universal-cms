import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin, apiError } from "@/lib/api/auth";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const supabase = await getSupabaseAdmin();

    // Fetch published content pages with SEO fields
    const { data: pages, error } = await supabase
      .from("content_pages")
      .select("id, title, slug, page_type, seo_title, seo_description, og_image, status")
      .eq("status", "published")
      .order("title");

    if (error) throw error;

    // Check for SEO keyword data if the table has seo columns
    let keywordData: Record<string, { focus_keyword: string | null; seo_score: number | null }> = {};
    try {
      const { data: kw } = await supabase
        .from("content_pages")
        .select("id, focus_keyword, seo_score")
        .eq("status", "published");
      if (kw) {
        for (const row of kw) {
          keywordData[row.id] = {
            focus_keyword: (row as Record<string, unknown>).focus_keyword as string | null,
            seo_score: (row as Record<string, unknown>).seo_score as number | null,
          };
        }
      }
    } catch {
      // SEO columns may not exist yet
    }

    const seoPages = (pages ?? []).map((page) => {
      const kw = keywordData[page.id];
      return {
        id: page.id,
        title: page.title,
        path: `/${page.slug}`,
        hasMetaDescription: !!page.seo_description,
        hasOgImage: !!page.og_image,
        hasSchema: !!page.seo_title,
        aeoScore: kw?.seo_score ?? (
          (page.seo_description ? 25 : 0) +
          (page.og_image ? 25 : 0) +
          (page.seo_title ? 25 : 0) +
          (kw?.focus_keyword ? 25 : 0)
        ),
      };
    });

    return NextResponse.json({ data: seoPages });
  } catch (e) {
    return apiError(e);
  }
}
