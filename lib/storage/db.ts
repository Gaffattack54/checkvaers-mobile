"use client";

import Dexie, { type Table } from "dexie";
import type { VaersRecord, Sex, MatchResult } from "@/lib/vaers/types";

/**
 * Cached copy of the downloaded VAERS snapshot. Single-row pattern keyed by
 * `id="vaers"`; we replace it wholesale when a new ETag is seen. Stored as
 * already-parsed records (not gzipped bytes) so the result page doesn't
 * re-parse on every nav.
 */
export interface CachedVaersData {
  id: string;
  etag: string | null;
  generatedAt: string;
  source: string;
  yearStart: number;
  yearEnd: number;
  records: VaersRecord[];
  cachedAt: number;
}

/**
 * Inputs the user supplied for a check, preserved for history display.
 * Stored as strings everywhere so they round-trip through IndexedDB without
 * the Date-serialization games.
 */
export interface SavedCheckInput {
  state: string; // 2-letter code
  sex: Sex;
  /** Date of birth, YYYY-MM-DD. */
  dob: string;
  /** Calculated age in years at the time the check was run. */
  ageYears: number;
  /** Dose dates as YYYY-MM-DD. */
  doseDates: string[];
}

/**
 * A historical check the user ran on this device. We persist the result
 * snapshot alongside the input, so re-opening a past check shows exactly
 * what they saw at the time — even if the VAERS dataset has since changed.
 */
export interface SavedCheck {
  /** UUID. */
  id: string;
  /** Epoch ms — also acts as the secondary sort/index key. */
  createdAt: number;
  input: SavedCheckInput;
  result: {
    exact: VaersRecord[];
    potential: VaersRecord[];
    none: boolean;
  };
}

/**
 * Interactive Report-tab checklist progress. Single-row pattern: we always
 * read/write the entry with id="current". (Future iteration could support
 * multiple in-progress drafts; the MVP only needs one.)
 */
export interface ReportDraft {
  id: string;
  /** Map of checklist-item key → done. */
  checks: Record<string, boolean>;
  /** Optional free-text notes the user has jotted. */
  notes: string;
  updatedAt: number;
}

class CheckVaersDb extends Dexie {
  checks!: Table<SavedCheck, string>;
  reports!: Table<ReportDraft, string>;
  dataCache!: Table<CachedVaersData, string>;

  constructor() {
    super("checkvaers");
    // v1: checks + reports
    this.version(1).stores({
      checks: "id, createdAt",
      reports: "id, updatedAt",
    });
    // v2: + dataCache (added in Step 10)
    this.version(2).stores({
      checks: "id, createdAt",
      reports: "id, updatedAt",
      dataCache: "id, cachedAt",
    });
  }
}

/**
 * Singleton DB handle. Lazy so we never touch IndexedDB during SSR.
 */
let _db: CheckVaersDb | null = null;

export function getDb(): CheckVaersDb {
  if (typeof window === "undefined") {
    throw new Error("CheckVaersDb cannot be used during SSR.");
  }
  if (!_db) _db = new CheckVaersDb();
  return _db;
}

/** Cheap, reasonably-unique id. Prefers crypto.randomUUID where available. */
export function newId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ------------------------------------------------------------------ */
/* Repos — small typed wrappers around the tables                     */
/* ------------------------------------------------------------------ */

export const checksRepo = {
  async list(): Promise<SavedCheck[]> {
    return getDb().checks.orderBy("createdAt").reverse().toArray();
  },
  async get(id: string): Promise<SavedCheck | undefined> {
    return getDb().checks.get(id);
  },
  async create(input: SavedCheckInput, result: MatchResult): Promise<SavedCheck> {
    const row: SavedCheck = {
      id: newId(),
      createdAt: Date.now(),
      input,
      result: {
        exact: result.exact,
        potential: result.potential,
        none: result.none,
      },
    };
    await getDb().checks.add(row);
    return row;
  },
  async remove(id: string): Promise<void> {
    await getDb().checks.delete(id);
  },
  async clear(): Promise<void> {
    await getDb().checks.clear();
  },
};

const DATA_CACHE_ID = "vaers";

export const dataCacheRepo = {
  async get(): Promise<CachedVaersData | undefined> {
    return getDb().dataCache.get(DATA_CACHE_ID);
  },
  async put(entry: Omit<CachedVaersData, "id" | "cachedAt">): Promise<void> {
    const row: CachedVaersData = {
      ...entry,
      id: DATA_CACHE_ID,
      cachedAt: Date.now(),
    };
    await getDb().dataCache.put(row);
  },
  async clear(): Promise<void> {
    await getDb().dataCache.delete(DATA_CACHE_ID);
  },
};

const CURRENT_REPORT_ID = "current";

export const reportRepo = {
  async load(): Promise<ReportDraft> {
    const existing = await getDb().reports.get(CURRENT_REPORT_ID);
    if (existing) return existing;
    const fresh: ReportDraft = {
      id: CURRENT_REPORT_ID,
      checks: {},
      notes: "",
      updatedAt: Date.now(),
    };
    await getDb().reports.put(fresh);
    return fresh;
  },
  async save(patch: Partial<Omit<ReportDraft, "id">>): Promise<void> {
    const current = await reportRepo.load();
    const next: ReportDraft = {
      ...current,
      ...patch,
      updatedAt: Date.now(),
    };
    await getDb().reports.put(next);
  },
  async reset(): Promise<void> {
    await getDb().reports.delete(CURRENT_REPORT_ID);
  },
};
