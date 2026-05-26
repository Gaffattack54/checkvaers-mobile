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

/** Parse a CSV file synchronously into an array of row objects. */
function readCsv<T = Record<string, string>>(file: string): T[] {
  const text = fs.readFileSync(file, "utf8");
  const result = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (result.errors.length) {
    console.warn(
      `[warn] ${path.basename(file)}: ${result.errors.length} parse error(s) — first: ${result.errors[0]?.message ?? ""}`
    );
  }
  return result.data;
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

    console.log(`  ${year}: reading...`);

    // VAX first: gives us the universe of COVID-19 VAERS_IDs for the year.
    const vaxRows = readCsv<{
      VAERS_ID: string;
      VAX_TYPE: string;
      VAX_MANU: string;
      VAX_DATE: string;
    }>(vaxFile);

    const covidByVaersId = new Map<
      string,
      { vaxManu: string; vaxDate: string }
    >();
    for (const v of vaxRows) {
      if (v.VAX_TYPE?.trim() !== "COVID19") continue;
      // Some IDs have multiple vax rows (multi-dose same report). Take first.
      if (covidByVaersId.has(v.VAERS_ID)) continue;
      covidByVaersId.set(v.VAERS_ID, {
        vaxManu: (v.VAX_MANU ?? "UNKNOWN MANUFACTURER").trim(),
        vaxDate: toIsoDate(v.VAX_DATE),
      });
    }

    if (covidByVaersId.size === 0) {
      console.log(`  ${year}: no COVID-19 rows.`);
      continue;
    }

    // SYMPTOMS: SYMPTOM1..SYMPTOM5 → string[]
    const symRows = readCsv<Record<string, string>>(symFile);
    const symptomsById = new Map<string, string[]>();
    for (const row of symRows) {
      if (!covidByVaersId.has(row.VAERS_ID)) continue;
      const list: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const v = row[`SYMPTOM${i}`]?.trim();
        if (v) list.push(v);
      }
      // Multiple symptom rows per report exist; merge unique.
      const prior = symptomsById.get(row.VAERS_ID) ?? [];
      for (const s of list) if (!prior.includes(s)) prior.push(s);
      symptomsById.set(row.VAERS_ID, prior);
    }

    // DATA: join in patient demographics + narrative.
    const dataRows = readCsv<{
      VAERS_ID: string;
      RECVDATE: string;
      STATE: string;
      AGE_YRS: string;
      SEX: string;
      SYMPTOM_TEXT: string;
      NUMDAYS: string;
    }>(dataFile);

    let yearCount = 0;
    for (const d of dataRows) {
      const vax = covidByVaersId.get(d.VAERS_ID);
      if (!vax) continue;

      const ageYears = Number.parseFloat(d.AGE_YRS);
      if (!Number.isFinite(ageYears)) continue;

      records.push({
        vaersId: d.VAERS_ID,
        state: (d.STATE ?? "").trim().toUpperCase(),
        sex: normalizeSex(d.SEX),
        ageYears: Math.round(ageYears),
        vaxDate: vax.vaxDate,
        vaxManu: vax.vaxManu,
        symptoms: symptomsById.get(d.VAERS_ID) ?? [],
        symptomText: (d.SYMPTOM_TEXT ?? "").trim(),
        recvDate: toIsoDate(d.RECVDATE),
        numDays: Number.isFinite(Number(d.NUMDAYS))
          ? Number(d.NUMDAYS)
          : null,
      });
      yearCount++;
    }

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

  const out: OutputFile = {
    metadata: {
      source: "vaers.hhs.gov",
      generatedAt: new Date().toISOString(),
      yearStart: args.yearStart,
      yearEnd: args.yearEnd,
      recordCount: records.length,
    },
    records,
  };

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  const json = JSON.stringify(out);
  await pipeline(
    fs.createReadStream(
      // write the JSON to a temp and stream-gzip it; avoids holding 2× size in RAM
      // for very large datasets.
      (() => {
        const tmp = args.output + ".tmp.json";
        fs.writeFileSync(tmp, json);
        return tmp;
      })()
    ),
    zlib.createGzip({ level: 9 }),
    fs.createWriteStream(args.output)
  );
  fs.unlinkSync(args.output + ".tmp.json");

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
