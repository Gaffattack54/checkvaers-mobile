"use client";

import { useEffect, useRef, useState } from "react";
import type { VaersRecord } from "./types";
import { MOCK_VAERS_RECORDS, MOCK_VAERS_METADATA } from "./mock-data";
import { dataCacheRepo, type CachedVaersData } from "@/lib/storage/db";

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export interface VaersDataset {
  records: readonly VaersRecord[];
  source: "mock" | "cache" | "network";
  generatedAt: string;
  yearStart: number;
  yearEnd: number;
}

export type LoaderStatus =
  | { kind: "idle" }
  | { kind: "loading"; progress?: number /* 0..1 */ }
  | { kind: "ready"; data: VaersDataset }
  | { kind: "error"; message: string; fallback?: VaersDataset };

export function useVaersData(): LoaderStatus {
  const [status, setStatus] = useState<LoaderStatus>({ kind: "idle" });
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void runLoader(setStatus);
  }, []);

  return status;
}

/* ------------------------------------------------------------------ */
/* Internals                                                          */
/* ------------------------------------------------------------------ */

const MOCK_DATASET: VaersDataset = {
  records: MOCK_VAERS_RECORDS,
  source: "mock",
  generatedAt: MOCK_VAERS_METADATA.generatedAt,
  yearStart: 2021,
  yearEnd: 2024,
};

async function runLoader(set: (s: LoaderStatus) => void) {
  const url = process.env.NEXT_PUBLIC_VAERS_DATA_URL?.trim();

  // No URL set → mock data, instantly.
  if (!url) {
    set({ kind: "ready", data: MOCK_DATASET });
    return;
  }

  set({ kind: "loading" });

  // Try cache first.
  let cached: CachedVaersData | undefined;
  try {
    cached = await dataCacheRepo.get();
  } catch {
    cached = undefined;
  }

  // ETag check — if we have a cache, ask the server if anything changed.
  // On failure, fall back to whatever we have cached (offline-friendly).
  let serverEtag: string | null = null;
  let needsDownload = !cached;
  try {
    const headers: HeadersInit = {};
    if (cached?.etag) headers["If-None-Match"] = cached.etag;
    const head = await fetch(url, { method: "HEAD", headers });
    serverEtag = head.headers.get("etag");
    if (cached && head.status === 304) {
      needsDownload = false;
    } else if (
      cached &&
      serverEtag &&
      cached.etag &&
      serverEtag === cached.etag
    ) {
      needsDownload = false;
    } else {
      needsDownload = true;
    }
  } catch {
    // Network unreachable: use cache if present, mock if not.
    if (cached) {
      set({ kind: "ready", data: cachedToDataset(cached) });
      return;
    }
    set({
      kind: "error",
      message:
        "Couldn't reach the VAERS data host. Using the bundled sample dataset.",
      fallback: MOCK_DATASET,
    });
    return;
  }

  if (!needsDownload && cached) {
    set({ kind: "ready", data: cachedToDataset(cached) });
    return;
  }

  // Download + decompress.
  try {
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Stream-decompress through DecompressionStream (browsers ≥ 2023).
    const totalHeader = response.headers.get("content-length");
    const total = totalHeader ? Number(totalHeader) : null;

    let downloaded = 0;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      downloaded += value.byteLength;
      if (total) {
        set({ kind: "loading", progress: downloaded / total });
      }
    }

    // TS sees Uint8Array<ArrayBufferLike> — Blob's BlobPart only accepts
    // Uint8Array<ArrayBuffer>. The runtime is happy either way.
    const blob = new Blob(chunks as BlobPart[]);
    const ds = new DecompressionStream("gzip");
    const decompressed = await new Response(
      blob.stream().pipeThrough(ds)
    ).text();
    const parsed = JSON.parse(decompressed) as {
      metadata: {
        source: string;
        generatedAt: string;
        yearStart: number;
        yearEnd: number;
      };
      records: VaersRecord[];
    };

    await dataCacheRepo.put({
      etag: serverEtag,
      generatedAt: parsed.metadata.generatedAt,
      source: parsed.metadata.source,
      yearStart: parsed.metadata.yearStart,
      yearEnd: parsed.metadata.yearEnd,
      records: parsed.records,
    });

    set({
      kind: "ready",
      data: {
        records: parsed.records,
        source: "network",
        generatedAt: parsed.metadata.generatedAt,
        yearStart: parsed.metadata.yearStart,
        yearEnd: parsed.metadata.yearEnd,
      },
    });
  } catch (e) {
    // Download failed mid-stream: fall back to cache, then mock.
    if (cached) {
      set({
        kind: "error",
        message: "Couldn't refresh — showing your cached snapshot.",
        fallback: cachedToDataset(cached),
      });
    } else {
      set({
        kind: "error",
        message:
          (e instanceof Error ? e.message : "Download failed.") +
          " — Using bundled sample dataset.",
        fallback: MOCK_DATASET,
      });
    }
  }
}

function cachedToDataset(c: CachedVaersData): VaersDataset {
  return {
    records: c.records,
    source: "cache",
    generatedAt: c.generatedAt,
    yearStart: c.yearStart,
    yearEnd: c.yearEnd,
  };
}
