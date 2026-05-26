"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js once on first paint. Silent — failed registration
 * shouldn't block the app from rendering. Only runs in production (the
 * dev server hot-reload + SW interact badly and produce 404 noise).
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* network or quota issue — non-fatal */
      });
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  return null;
}
