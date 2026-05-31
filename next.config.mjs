/** @type {import('next').NextConfig} */
const nextConfig = {
  // Same-origin proxy for the VAERS data snapshot.
  //
  // GitHub Release asset URLs (and their final release-assets.githubusercontent.com
  // redirect target) don't send Access-Control-Allow-Origin headers, so a browser
  // fetch from https://check-vaers.vercel.app is blocked by CORS.
  //
  // Routing through `/data/vaers-covid-7yr.json.gz` makes the request same-origin
  // from the browser's POV — Vercel's edge fetches the GitHub URL server-side and
  // streams it back. No CORS issue, and Vercel can cache the response.
  async rewrites() {
    const dataUrl = process.env.VAERS_DATA_SOURCE_URL;
    if (!dataUrl) return [];
    return [
      {
        source: "/data/vaers-covid-7yr.json.gz",
        destination: dataUrl,
      },
    ];
  },
};

export default nextConfig;
