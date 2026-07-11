import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Vehicle } from "../src/vehicle";

// Build-failing data-integrity gate (spec §4): the real shipped dataset must
// satisfy the Vehicle schema. This runs as part of `npm test`, so a bad edit to
// data/cars.json fails locally — not only in the CI validate-data step.
const here = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(here, "..", "..", "data", "cars.json");
const cars = JSON.parse(readFileSync(DATA_PATH, "utf8")) as unknown[];

describe("data/cars.json integrity", () => {
  it("is a non-trivial array of vehicles", () => {
    expect(Array.isArray(cars)).toBe(true);
    expect(cars.length).toBeGreaterThanOrEqual(180);
  });

  it("every vehicle satisfies the Vehicle schema (incl. powertrain-required fields)", () => {
    const failures: string[] = [];
    for (const [i, c] of cars.entries()) {
      const parsed = Vehicle.safeParse(c);
      if (!parsed.success) {
        const id = (c as { id?: string })?.id ?? `index ${i}`;
        failures.push(
          `${id}: ${parsed.error.issues
            .map((x) => `${x.path.join(".")} ${x.message}`)
            .join("; ")}`,
        );
      }
    }
    expect(failures, `\n${failures.slice(0, 5).join("\n")}`).toHaveLength(0);
  });

  it("has unique ids", () => {
    const ids = (cars as { id: string }[]).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
