#!/usr/bin/env node
/**
 * Re-generates the PWA icon PNGs from public/icons/icon-source.svg.
 * Run with: npm run generate:icons
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE = path.resolve("public/icons/icon-source.svg");
const OUT_DIR = path.resolve("public/icons");

// Standard PWA + iOS icon sizes.
const SIZES = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-256.png", size: 256 },
  { name: "icon-384.png", size: 384 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-icon-180.png", size: 180 },
  // 32 is for browser favicon fallback
  { name: "favicon-32.png", size: 32 },
];

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Source SVG not found: ${SOURCE}`);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const svg = fs.readFileSync(SOURCE);

  for (const { name, size } of SIZES) {
    const out = path.join(OUT_DIR, name);
    await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
    console.log(`  ${name} (${size}x${size})`);
  }
  console.log(`\n[done] ${SIZES.length} icons written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(`\n[error] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
