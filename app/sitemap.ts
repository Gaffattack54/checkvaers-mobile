import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://checkvaers.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = [
    "/",
    "/check",
    "/check/state",
    "/check/sex",
    "/check/dob",
    "/check/doses",
    "/check/review",
    "/learn",
    "/report",
    "/history",
    "/privacy",
  ];
  return staticPaths.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/check" ? "weekly" : "monthly",
    priority: path === "/" || path === "/check" ? 1.0 : 0.7,
  }));
}
