#!/usr/bin/env node
/**
 * prepare-vaers-data.ts
 *
 * Builds the CheckVAERS data snapshot from a directory of public VAERS CSVs.
 *
 * Why a manual local step:
 *   The public VAERS download page at https://vaers.hhs.gov/data/datasets.html
 *   serves session-gated ZIPs that can't be reliably fetched headlessly.
 *   Manual download is a few clicks per year and produces ZIPs named like
 *   `2023VAERSData.zip`. Extract them into ONE directory and point this
 *   script at it.
 *
 * What it does:
 *   - For each `<YEAR>VAERSDATA.csv` it finds in --input,
 *   - reads the matching `<YEAR>VAERSVAX.csv` and `<YEAR>VAERSSYMPTOMS.csv`,
 *   - filters to rows where VAX_TYPE === "COVID19",
 *   - joins on VAERS_ID,
 *   - keeps only the fields used by the matcher / UI,
 *   - serializes one big JSON object to gzipped output.
 *
 * Usage:
 *   npm run prepare:vaers -- --input ./vaers-raw --output ./dist/vaers-covid-7yr.json.gz
 *
 *   --input    Directory of extracted VAERS CSVs                  [default: ./vaers-raw]
 *   --output   Destination .json.gz                               [default: ./dist/vaers-covid-7yr.json.gz]
 *   --years    Range like 2018-2024 (inclusive). Defaults to last 7 years.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { pipeline } from "node:stream/promises";
import Papa from "papaparse";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface Args {
  input: string;
  output: string;
  yearStart: number;
  yearEnd: number;
}

interface OutputRecord {
  vaersId: string;
  state: string;
  sex: "M" | "F" | "U";
  ageYears: number;
  vaxDate: string;
  vaxManu: string;
  symptoms: string[];
  symptomText: string;
  recvDate: string;
  numDays: number | null;
}

interface OutputFile {
  metadata: {
    source: "vaers.hhs.gov";
    generatedAt: string;
    yearStart: number;
    yearEnd: number;
    recordCount: number;
  };
  records: OutputRecord[];
}

/* ------------------------------------------------------------------ */
/* CLI                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(argv: string[]): Args {
  const result: Partial<Args> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--input") {
      result.input = next;
      i++;
    } else if (a === "--output") {
      result.output = next;
      i++;
    } else if (a === "--years") {
      const m = /^(\d{4})-(\d{4})$/.exec(next ?? "");
      if (!m) {
        throw new Error("`--years` expects YYYY-YYYY, e.g. 2018-2024");
      }
      result.yearStart = Number(m[1]);
      result.yearEnd = Number(m[2]);
      i++;
    } else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: tsx scripts/prepare-vaers-data.ts [--input DIR] [--output FILE] [--years YYYY-YYYY]"
      );
      process.exit(0);
    }
  }
  const thisYear = new Date().getFullYear();
  return {
    input: path.resolve(result.input ?? "./vaers-raw"),
    output: path.resolve(
      result.output ?? "./dist/vaers-covid-7yr.json.gz"
    ),
    yearStart: result.yearStart ?? thisYear - 6,
    yearEnd: result.yearEnd ?? thisYear,
  };
}

/* ------------------------------------------------------------------ */
/* CSV helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Stream-parse a CSV file row by row, calling `onRow` for each.
 *
 * VAERS DATA files for high-activity years (2021 alone is ~630 MB) exceed
 * V8's max-string limit (~512 MB), so reading the whole file as one
 * string is not viable. Streaming keeps memory bounded regardless of
 * file size — only the current row sits in memory.
 *
 * Uses Papaparse's Node stream input mode:
 *   createReadStream(file).pipe(Papa.parse(Papa.NODE_STREAM_INPUT, { header: true }))
 * which emits parsed row objects as a Node stream.
 */
function streamCsv<T = Record<string, string>>(
  file: string,
  onRow: (row: T) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PapaAny = Papa as any;
    const parseStream = PapaAny.parse(PapaAny.NODE_STREAM_INPUT, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
    });
    const read = fs.createReadStream(file);
    let bad = 0;
    parseStream.on("data", (row: T) => {
      try {
        onRow(row);
      } catch {
        bad++;
      }
    });
    parseStream.on("end", () => {
      if (bad > 0) {
        console.warn(`[warn] ${path.basename(file)}: ${bad} row(s) skipped`);
      }
      resolve();
    });
    parseStream.on("error", reject);
    read.on("error", reject);
    read.pipe(parseStream);
  });
}

/** Convert VAERS date strings like "03/14/2021" → ISO "2021-03-14". */
function toIsoDate(usDate: string | undefined): string {
  if (!usDate) return "";
  const trimmed = usDate.trim();
  // Some files use M/D/YYYY, some MM/DD/YYYY. Normalize.
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!m) return "";
  const month = m[1].padStart(2, "0");
  const day = m[2].padStart(2, "0");
  return `${m[3]}-${month}-${day}`;
}

function normalizeSex(s: string | undefined): "M" | "F" | "U" {
  const v = (s ?? "").trim().toUpperCase();
  return v === "M" || v === "F" ? v : "U";
}

/**
 * Truncate a narrative string at a word boundary, append "…" if cut.
 *
 * VAERS SYMPTOM_TEXT averages a few hundred chars but can run multiple
 * KB. Keeping the full text would push the prepared snapshot well past
 * mobile-browser parse + storage limits; 200 chars retains the
 * chronology / context the result cards actually show users.
 */
const NARRATIVE_MAX = 200;
function truncateNarrative(s: string): string {
  const trimmed = s.trim();
  if (trimmed.length <= NARRATIVE_MAX) return trimmed;
  // Cut at the last whitespace before the limit; fall back to a hard cut
  // if the first 200 chars are a single word.
  const window = trimmed.slice(0, NARRATIVE_MAX);
  const wordCut = window.replace(/\s+\S*$/, "");
  return (wordCut || window) + "…";
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`[prepare-vaers-data]`);
  console.log(`  input : ${args.input}`);
  console.log(`  output: ${args.output}`);
  console.log(`  years : ${args.yearStart}-${args.yearEnd}`);

  if (!fs.existsSync(args.input)) {
    throw new Error(
      `Input directory not found: ${args.input}\n  Drop the extracted VAERS CSVs there (e.g. 2023VAERSDATA.csv, 2023VAERSVAX.csv, 2023VAERSSYMPTOMS.csv) and re-run.`
    );
  }

  const records: OutputRecord[] = [];

  for (let year = args.yearStart; year <= args.yearEnd; year++) {
    const dataFile = path.join(args.input, `${year}VAERSDATA.csv`);
    const vaxFile = path.join(args.input, `${year}VAERSVAX.csv`);
    const symFile = path.join(args.input, `${year}VAERSSYMPTOMS.csv`);

    if (!fs.existsSync(dataFile) || !fs.existsSync(vaxFile) || !fs.existsSync(symFile)) {
      console.log(`  ${year}: skipped (missing one or more CSVs)`);
      continue;
    }

    console.log(`  ${year}: reading vax…`);

    // VAX first: gives us the universe of COVID-19 VAERS_IDs + manufacturer.
    // (VAX_DATE lives in VAERSDATA.csv, not here — VAERSVAX only carries
    // VAX_TYPE/VAX_MANU/VAX_LOT/VAX_DOSE_SERIES/VAX_ROUTE/VAX_SITE/VAX_NAME.)
    const covidByVaersId = new Map<string, { vaxManu: string }>();
    await streamCsv<{
      VAERS_ID: string;
      VAX_TYPE: string;
      VAX_MANU: string;
    }>(vaxFile, (v) => {
      if (v.VAX_TYPE?.trim() !== "COVID19") return;
      // Multi-dose reports have multiple vax rows; keep the first.
      if (covidByVaersId.has(v.VAERS_ID)) return;
      covidByVaersId.set(v.VAERS_ID, {
        vaxManu: (v.VAX_MANU ?? "UNKNOWN MANUFACTURER").trim(),
      });
    });

    if (covidByVaersId.size === 0) {
      console.log(`  ${year}: no COVID-19 rows.`);
      continue;
    }
    console.log(
      `  ${year}: ${covidByVaersId.size.toLocaleString()} COVID reports, reading symptoms…`
    );

    // SYMPTOMS: SYMPTOM1..SYMPTOM5 → string[]
    const symptomsById = new Map<string, string[]>();
    await streamCsv<Record<string, string>>(symFile, (row) => {
      if (!covidByVaersId.has(row.VAERS_ID)) return;
      const list: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const v = row[`SYMPTOM${i}`]?.trim();
        if (v) list.push(v);
      }
      const prior = symptomsById.get(row.VAERS_ID) ?? [];
      for (const s of list) if (!prior.includes(s)) prior.push(s);
      symptomsById.set(row.VAERS_ID, prior);
    });

    console.log(`  ${year}: reading data…`);

    let yearCount = 0;
    await streamCsv<{
      VAERS_ID: string;
      RECVDATE: string;
      STATE: string;
      AGE_YRS: string;
      SEX: string;
      VAX_DATE: string;
      SYMPTOM_TEXT: string;
      NUMDAYS: string;
    }>(dataFile, (d) => {
      const vax = covidByVaersId.get(d.VAERS_ID);
      if (!vax) return;

      const ageYears = Number.parseFloat(d.AGE_YRS);
      if (!Number.isFinite(ageYears)) return;

      const vaxDate = toIsoDate(d.VAX_DATE);
      // Reports without a vaccination date can't participate in the
      // date-window match. Drop them.
      if (!vaxDate) return;

      records.push({
        vaersId: d.VAERS_ID,
        state: (d.STATE ?? "").trim().toUpperCase(),
        sex: normalizeSex(d.SEX),
        ageYears: Math.round(ageYears),
        vaxDate,
        vaxManu: vax.vaxManu,
        symptoms: symptomsById.get(d.VAERS_ID) ?? [],
        symptomText: truncateNarrative(d.SYMPTOM_TEXT ?? ""),
        recvDate: toIsoDate(d.RECVDATE),
        numDays: Number.isFinite(Number(d.NUMDAYS))
          ? Number(d.NUMDAYS)
          : null,
      });
      yearCount++;
    });

    console.log(`  ${year}: kept ${yearCount.toLocaleString()} records`);
  }

  if (records.length === 0) {
    throw new Error(
      "No COVID-19 records produced. Check that the input directory has the expected CSVs."
    );
  }

  // Sort by vaxDate for deterministic output; aids gzip compression and
  // diff-friendliness across runs.
  records.sort((a, b) => a.vaxDate.localeCompare(b.vaxDate));

  const metadata = {
    source: "vaers.hhs.gov" as const,
    generatedAt: new Date().toISOString(),
    yearStart: args.yearStart,
    yearEnd: args.yearEnd,
    recordCount: records.length,
  };

  fs.mkdirSync(path.dirname(args.output), { recursive: true });

  // Stream-write the JSON: assemble the wrapper by hand and write one
  // record at a time. JSON.stringify on the whole object would build a
  // single string > 1 GB for full datasets, blowing V8's max-string cap.
  const tmpJson = args.output + ".tmp.json";
  const jsonStream = fs.createWriteStream(tmpJson);
  await new Promise<void>((resolve, reject) => {
    jsonStream.on("error", reject);
    jsonStream.on("finish", () => resolve());
    jsonStream.write(`{"metadata":${JSON.stringify(metadata)},"records":[`);
    for (let i = 0; i < records.length; i++) {
      if (i > 0) jsonStream.write(",");
      jsonStream.write(JSON.stringify(records[i]));
    }
    jsonStream.write("]}");
    jsonStream.end();
  });

  await pipeline(
    fs.createReadStream(tmpJson),
    zlib.createGzip({ level: 9 }),
    fs.createWriteStream(args.output)
  );
  fs.unlinkSync(tmpJson);

  const stat = fs.statSync(args.output);
  console.log(
    `\n[done] ${records.length.toLocaleString()} records → ${args.output} (${(stat.size / 1024 / 1024).toFixed(1)} MB compressed)`
  );
  console.log(
    `\nUpload this file to your hosting target (Cloudflare R2 or a GitHub Release),`
  );
  console.log(
    `then set NEXT_PUBLIC_VAERS_DATA_URL in .env.local to its public URL.`
  );
}

main().catch((err) => {
  console.error(`\n[error] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
