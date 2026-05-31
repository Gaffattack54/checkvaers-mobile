import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Per-user state lives in /history; nothing to crawl there
        // (it's all client-rendered from IndexedDB anyway).
        allow: ["/", "/check", "/learn", "/report", "/about", "/privacy"],
        disallow: ["/history", "/check/result"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
