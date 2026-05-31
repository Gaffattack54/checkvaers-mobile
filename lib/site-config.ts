/**
 * Site-wide configurable strings.
 *
 * These are referenced in the metadata, sitemap, robots, about, and
 * privacy pages. Override per environment via .env.local (development)
 * or Vercel project settings (production). The defaults below are safe
 * placeholders for local dev — replace before going to production.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://checkvaers.app";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "hello@checkvaers.app";

export const REPO_URL =
  process.env.NEXT_PUBLIC_REPO_URL?.trim() ||
  "https://github.com/Gaffattack54/checkvaers-mobile";

/**
 * Build-time variant flag.
 *
 *  - `"site"` → render the rich marketing landing at `/`. Used by the
 *              `checkvaers-site` Vercel project (eventually checkvaers.com).
 *  - anything else (including unset) → render the minimal app landing.
 *              Used by the `check-vaers` Vercel project (the app).
 *
 * Everything else in the codebase (the check flow, Learn, Report,
 * History, etc.) is identical across variants.
 */
export const VARIANT =
  process.env.NEXT_PUBLIC_VARIANT?.trim() === "site" ? "site" : "app";
