import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://checkvaers.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Per-user state lives in /history; nothing to crawl there
        // (it's all client-rendered from IndexedDB anyway).
        allow: ["/", "/check", "/learn", "/report", "/privacy"],
        disallow: ["/history", "/check/result"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
