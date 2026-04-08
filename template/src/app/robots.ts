import type { MetadataRoute } from "next";
import { cmsConfig } from "@/cms.config";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = cmsConfig.siteUrl.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
