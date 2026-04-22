import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { cmsConfig } from "@/cms.config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = cmsConfig.siteUrl.replace(/\/$/, "");
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return entries;
  }

  const supabase = await createAdminClient();

  // Content pages (published articles, guides, etc.)
  if (cmsConfig.modules.contentPages) {
    try {
      const { data: pages } = await supabase
        .from("content_pages")
        .select("slug, page_type, updated_at")
        .eq("status", "published");

      for (const page of pages ?? []) {
        const prefix = page.page_type === "article" ? "/blog" : "";
        entries.push({
          url: `${siteUrl}${prefix}/${page.slug}`,
          lastModified: new Date(page.updated_at),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    } catch {
      // Table may not exist yet
    }
  }

  // Directory entities
  if (cmsConfig.modules.directory) {
    try {
      const { data: entities } = await supabase
        .from("entities")
        .select("slug, updated_at")
        .eq("status", "published");

      for (const entity of entities ?? []) {
        entries.push({
          url: `${siteUrl}${cmsConfig.primaryEntity.slugPrefix}/${entity.slug}`,
          lastModified: new Date(entity.updated_at),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    } catch {
      // Table may not exist yet
    }
  }

  // Categories
  if (cmsConfig.modules.categories) {
    try {
      const { data: categories } = await supabase
        .from("categories")
        .select("slug, updated_at");

      for (const cat of categories ?? []) {
        entries.push({
          url: `${siteUrl}/category/${cat.slug}`,
          lastModified: new Date(cat.updated_at),
          changeFrequency: "monthly",
          priority: 0.5,
        });
      }
    } catch {
      // Table may not exist yet
    }
  }

  return entries;
}
