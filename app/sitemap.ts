import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

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
    "/about",
    "/privacy",
  ];
  return staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/check" ? "weekly" : "monthly",
    priority: path === "/" || path === "/check" ? 1.0 : 0.7,
  }));
}
