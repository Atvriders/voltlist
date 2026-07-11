#!/usr/bin/env tsx
/**
 * Data-integrity harness for VoltList.
 *
 * Imports the frozen Vehicle Zod schema from @voltlist/shared, reads
 * data/cars.json, and validates the whole dataset:
 *   - every entry parses against the Vehicle schema (incl. powertrain refinement)
 *   - ids are unique
 *   - sanity ranges hold for non-null values
 *   - at least 180 vehicles total
 *   - at least one model for each required brand (spec section 3)
 *
 * Exits non-zero and prints a clear report on any failure.
 * This is EXPECTED to fail until the curation fleet produces data/cars.json.
 *
 * Run: `npx tsx scripts/validate-data.ts`  (or `npm run validate-data`)
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Vehicle } from "@voltlist/shared";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_PATH = resolve(ROOT, "data/cars.json");

// Required brands — spec section 3 (every brand selling an electrified model
// new in the USA for MY2024–2026). Each must have >= 1 vehicle.
// Brands that actually sell a new BEV/PHEV/HEV in the USA for MY2024-2026.
// Buick and INFINITI are intentionally excluded: neither offers any electrified
// vehicle new in the US in this window (Buick's Electra EVs are China-only; the
// INFINITI QXe is a concept, first US EV ~2028). Verified 2026-07-11.
const REQUIRED_BRANDS = [
  "Acura", "Alfa Romeo", "Audi", "BMW", "Cadillac", "Chevrolet",
  "Chrysler", "Dodge", "Fiat", "Ford", "Genesis", "GMC", "Honda", "Hyundai",
  "Jaguar", "Jeep", "Kia", "Land Rover", "Lexus", "Lincoln",
  "Lucid", "Maserati", "Mazda", "Mercedes-Benz", "MINI", "Mitsubishi",
  "Nissan", "Polestar", "Porsche", "Ram", "Rivian", "Subaru", "Tesla",
  "Toyota", "Volkswagen", "Volvo", "VinFast",
];

const MIN_VEHICLES = 180;
const VALID_YEARS = new Set([2024, 2025, 2026]);

interface Range {
  field: string;
  min: number;
  max: number;
}

const SANITY_RANGES: Range[] = [
  { field: "electricRangeMi", min: 10, max: 520 },
  { field: "msrpBaseUsd", min: 15000, max: 250000 },
  { field: "zeroToSixtySec", min: 1.5, max: 15 },
  { field: "seatingCapacity", min: 2, max: 9 },
];

const errors: string[] = [];

function fail(msg: string): void {
  errors.push(msg);
}

function main(): void {
  if (!existsSync(DATA_PATH)) {
    fail(`data/cars.json not found at ${DATA_PATH} — the curation fleet has not produced it yet.`);
    report();
    return;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(DATA_PATH, "utf8"));
  } catch (e) {
    fail(`data/cars.json is not valid JSON: ${(e as Error).message}`);
    report();
    return;
  }

  if (!Array.isArray(raw)) {
    fail("data/cars.json must be a JSON array of vehicles.");
    report();
    return;
  }

  const entries = raw as unknown[];

  // 1. Schema validation (per entry).
  const parsed: Array<ReturnType<typeof Vehicle.parse>> = [];
  entries.forEach((entry, i) => {
    const result = Vehicle.safeParse(entry);
    if (!result.success) {
      const rec = entry as { id?: unknown };
      const label = typeof rec?.id === "string" ? rec.id : `index ${i}`;
      const issues = result.error.issues
        .map((iss) => `      - ${iss.path.join(".") || "(root)"}: ${iss.message}`)
        .join("\n");
      fail(`Vehicle "${label}" failed schema validation:\n${issues}`);
    } else {
      parsed.push(result.data);
    }
  });

  // 2. Unique ids.
  const seen = new Map<string, number>();
  parsed.forEach((v) => seen.set(v.id, (seen.get(v.id) ?? 0) + 1));
  for (const [id, count] of seen) {
    if (count > 1) fail(`Duplicate id "${id}" appears ${count} times.`);
  }

  // 3. Sanity ranges (non-null only) + year set.
  parsed.forEach((v) => {
    for (const { field, min, max } of SANITY_RANGES) {
      const val = (v as unknown as Record<string, unknown>)[field];
      if (typeof val === "number" && (val < min || val > max)) {
        fail(`Vehicle "${v.id}": ${field}=${val} is outside sanity range [${min}, ${max}].`);
      }
    }
    if (!VALID_YEARS.has(v.year)) {
      fail(`Vehicle "${v.id}": year ${v.year} is not one of 2024, 2025, 2026.`);
    }
  });

  // 4. Minimum count.
  if (parsed.length < MIN_VEHICLES) {
    fail(`Only ${parsed.length} valid vehicles; need at least ${MIN_VEHICLES}.`);
  }

  // 5. Brand coverage.
  const makes = new Set(parsed.map((v) => v.make.toLowerCase()));
  const missing = REQUIRED_BRANDS.filter((b) => !makes.has(b.toLowerCase()));
  if (missing.length > 0) {
    fail(`Missing required brand(s) (spec section 3): ${missing.join(", ")}.`);
  }

  report(parsed.length);
}

function report(validCount = 0): void {
  if (errors.length === 0) {
    console.log(`✓ data/cars.json passed: ${validCount} vehicles, all valid, unique ids, ranges OK, all brands present.`);
    process.exit(0);
  }
  console.error(`✗ Data-integrity check FAILED with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error(`\n${errors.length} problem(s) must be fixed before the build can pass.`);
  process.exit(1);
}

main();
