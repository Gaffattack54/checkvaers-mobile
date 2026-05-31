/**
 * Server-side proxy for the VAERS data snapshot.
 *
 * GitHub Release URLs redirect to release-assets.githubusercontent.com,
 * which doesn't send Access-Control-Allow-Origin headers. A direct browser
 * fetch to either URL fails CORS. A Vercel `rewrite` doesn't help — it
 * forwards the 302 response, and the browser blocks the cross-origin
 * redirect.
 *
 * This route fetches server-side (where CORS doesn't apply), follows the
 * redirect, and streams the bytes back from our origin. Vercel's edge
 * caches the response — first user pays the GitHub latency, subsequent
 * users get it from the CDN.
 *
 * VAERS_DATA_SOURCE_URL is a server-only env var (not NEXT_PUBLIC),
 * configured separately from NEXT_PUBLIC_VAERS_DATA_URL (the client
 * reads `/api/vaers-data`).
 */

import { NextResponse } from "next/server";

// Always handle the request at runtime (don't try to pre-render the 70 MB
// response into the build — Vercel's ISR cap is 19 MB).
//
// Vercel's CDN still caches based on the `Cache-Control` response header,
// so first-after-revalidate request pays the upstream latency and
// subsequent users hit the edge cache for 24h.
export const dynamic = "force-dynamic";

export async function GET() {
  const source = process.env.VAERS_DATA_SOURCE_URL;
  if (!source) {
    return new NextResponse(
      JSON.stringify({
        error: "VAERS_DATA_SOURCE_URL not configured on this deployment.",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }

  const upstream = await fetch(source, { redirect: "follow" });
  if (!upstream.ok || !upstream.body) {
    return new NextResponse(
      JSON.stringify({
        error: `Upstream returned ${upstream.status}`,
      }),
      {
        status: upstream.status || 502,
        headers: { "content-type": "application/json" },
      }
    );
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "content-type": "application/gzip",
      "cache-control":
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "access-control-allow-origin": "*",
    },
  });
}
