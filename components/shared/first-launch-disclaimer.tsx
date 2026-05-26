"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "checkvaers:disclaimer-acknowledged-v1";

/**
 * One-time banner shown on the Check tab until the user acknowledges it.
 * Renders nothing on the server; on first render in the browser we read
 * localStorage to decide. Keep simple — no Zustand needed, no SSR drift.
 */
export function FirstLaunchDisclaimer() {
  // null = not-yet-checked-storage (don't render), true/false = decided
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const acknowledged = window.localStorage.getItem(STORAGE_KEY) === "1";
      setShow(!acknowledged);
    } catch {
      // localStorage blocked (private mode etc.) — show the banner once per session.
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* non-fatal */
    }
  };

  if (show !== true) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and disclaimer"
      className={cn(
        "mb-6 flex gap-3 rounded-2xl bg-brand-navy/95 p-4 text-white shadow-card"
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-cyan/20 text-brand-cyan"
      >
        <Lock className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Private by design.</p>
        <p className="mt-1 text-white/85">
          All matching happens on your device. CheckVAERS isn&apos;t a
          medical diagnostic tool — consult a healthcare provider for
          medical advice.{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:no-underline"
          >
            Privacy details
          </Link>
          .
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="-mr-2 -mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
