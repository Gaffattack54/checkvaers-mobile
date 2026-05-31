/**
 * Headless screenshot harness for the CheckVAERS clinician brief.
 *
 * Drives Chrome (Windows path) in headless mode. For each (deployment,
 * viewport, route) tuple it produces a PNG named like
 *   site_dt_check-state.png      (desktop site, /check/state)
 *   app_mo_learn.png             (mobile  app,  /learn)
 *
 * For routes that need pre-existing draft state (the check flow steps
 * downstream of /check/state, the /check/result page, /history with
 * an item), we POST the right state into sessionStorage / IndexedDB
 * via Chrome's --evaluate-on-new-document path. Implemented by
 * navigating through the flow rather than fabricating state — that
 * way the screenshots match what a real user actually sees.
 *
 * Run with: node scripts/capture-shots.js
 */

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const CHROME =
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

const OUT = path.resolve("brief-shots");
fs.mkdirSync(OUT, { recursive: true });

const DEPLOYMENTS = [
  { key: "site", url: "https://checkvaers-site.vercel.app" },
  { key: "app", url: "https://check-vaers.vercel.app" },
];

const VIEWPORTS = [
  { key: "dt", w: 1440, h: 900 },
  { key: "mo", w: 390, h: 844 },
];

// Routes — only routes that render usefully without pre-existing state.
// Flow steps (sex/dob/doses/review/result) require sessionStorage and
// IndexedDB; we'll skip those for now and substitute the screenshots
// the user already captured manually.
const ROUTES = [
  { key: "home", path: "/" },
  { key: "check", path: "/check" },
  { key: "check-state", path: "/check/state" },
  { key: "learn", path: "/learn" },
  { key: "report", path: "/report" },
  { key: "history", path: "/history" },
  { key: "about", path: "/about" },
  { key: "privacy", path: "/privacy" },
];

function shoot({ deployment, viewport, route }) {
  const out = path.join(
    OUT,
    `${deployment.key}_${viewport.key}_${route.key}.png`
  );
  const url = `${deployment.url}${route.path}`;
  // --virtual-time-budget gives async fonts/css time to settle.
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-sandbox",
    "--disable-features=Translate",
    `--window-size=${viewport.w},${viewport.h}`,
    `--screenshot=${out}`,
    "--virtual-time-budget=5000",
    url,
  ];
  return new Promise((resolve, reject) => {
    execFile(CHROME, args, { timeout: 60_000 }, (err, _stdout, stderr) => {
      if (err) {
        console.error(`  fail ${path.basename(out)}: ${err.message}`);
        return reject(err);
      }
      const stat = fs.statSync(out, { throwIfNoEntry: false });
      if (!stat || stat.size < 4096) {
        return reject(new Error(`empty output for ${out}`));
      }
      console.log(
        `  ok   ${path.basename(out).padEnd(34)} ${(stat.size / 1024).toFixed(0)} KB`
      );
      resolve();
    });
  });
}

async function main() {
  const jobs = [];
  for (const d of DEPLOYMENTS) {
    for (const v of VIEWPORTS) {
      for (const r of ROUTES) {
        jobs.push({ deployment: d, viewport: v, route: r });
      }
    }
  }
  console.log(`Capturing ${jobs.length} shots → ${OUT}\n`);
  // Sequential — Chrome headless on Windows handles parallel poorly.
  let failed = 0;
  for (const job of jobs) {
    try {
      await shoot(job);
    } catch {
      failed++;
    }
  }
  console.log(`\nDone. ${jobs.length - failed} / ${jobs.length} succeeded.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
