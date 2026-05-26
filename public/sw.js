/* eslint-disable no-restricted-globals */
/**
 * CheckVAERS service worker — minimal, no Workbox.
 *
 * Strategies:
 *   - Pre-cache the app shell on install (so the app boots offline).
 *   - HTML navigations  → network-first, fall back to cached shell.
 *   - Same-origin static (_next/static/, /icons/, /patterns/) → cache-first.
 *   - VAERS data file (matched by URL substring) → cache-first; updates
 *     come via the in-app ETag check (lib/vaers/data-loader.ts), not here.
 *   - Everything else                       → network, with a graceful
 *                                             fall-through to cache if present.
 *
 * Bump VERSION whenever the shell strategy changes — old caches are
 * pruned on activate.
 */

const VERSION = "v1";
const SHELL_CACHE = `checkvaers-shell-${VERSION}`;
const RUNTIME_CACHE = `checkvaers-runtime-${VERSION}`;

const APP_SHELL_URLS = ["/", "/check", "/learn", "/report", "/history"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Best-effort: a stuck pre-cache shouldn't block install in dev.
      await Promise.all(
        APP_SHELL_URLS.map((u) =>
          cache.add(new Request(u, { cache: "reload" })).catch(() => {})
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n !== SHELL_CACHE && n !== RUNTIME_CACHE)
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/patterns/")
  );
}

function isVaersData(url) {
  return /vaers[-_].*\.json(\.gz)?$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Cross-origin VAERS data hosted on R2 / GitHub: cache-first.
  if (isVaersData(url)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // Same-origin only beyond here.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigationStrategy(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }
});

async function navigationStrategy(request) {
  try {
    const fresh = await fetch(request);
    // Update the shell cache for next time.
    const copy = fresh.clone();
    caches.open(SHELL_CACHE).then((c) => c.put(request, copy)).catch(() => {});
    return fresh;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match("/");
    if (fallback) return fallback;
    return new Response("You are offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const copy = fresh.clone();
      caches.open(cacheName).then((c) => c.put(request, copy)).catch(() => {});
    }
    return fresh;
  } catch {
    return cached ?? new Response("", { status: 504 });
  }
}
