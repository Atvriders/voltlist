import { Router } from "express";
import { z } from "zod";
import { Powertrain, Drivetrain, BodyStyle, ChargePort } from "@voltlist/shared";
import type { CarQuery } from "@voltlist/shared";
import type { CarStore } from "../carStore";

/** Normalize a querystring value (string | string[] | undefined) to string[]. */
function toArray(value: unknown): string[] | undefined {
  if (value == null) return undefined;
  const arr = Array.isArray(value) ? value : [value];
  const out = arr.flatMap((x) => String(x).split(",")).map((s) => s.trim()).filter(Boolean);
  return out.length > 0 ? out : undefined;
}

const csv = z.preprocess((v) => toArray(v), z.array(z.string()).optional());
const csvEnum = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => toArray(v), z.array(item).optional());
const boolParam = z
  .preprocess((v) => (v === undefined ? undefined : v), z.enum(["true", "false"]).optional())
  .transform((v) => (v === undefined ? undefined : v === "true"));

/** Treat null/undefined/blank/whitespace as "absent" so it doesn't coerce to 0. */
const blankToUndefined = (v: unknown): unknown =>
  v == null || String(v).trim() === "" ? undefined : v;
const numParam = z.preprocess(blankToUndefined, z.coerce.number().optional());

const CarQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  powertrain: csvEnum(Powertrain),
  make: csv,
  bodyStyle: csvEnum(BodyStyle),
  drivetrain: csvEnum(Drivetrain),
  chargePort: csvEnum(ChargePort),
  minPrice: numParam,
  maxPrice: numParam,
  minElectricRange: numParam,
  minSeating: numParam,
  taxCreditOnly: boolParam,
  needsAdaptiveCruise: boolParam,
  needsLaneAssist: boolParam,
  needsHandsFree: boolParam,
  sort: z.enum(["price", "range", "zeroToSixty", "efficiency", "horsepower"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.preprocess(blankToUndefined, z.coerce.number().int().positive().optional()),
  pageSize: z.preprocess(blankToUndefined, z.coerce.number().int().positive().max(100).optional()),
});

const CompareSchema = z.object({
  ids: z.preprocess((v) => toArray(v) ?? [], z.array(z.string())),
});

/** Mounted at /api/cars — list + by-id. */
export function carsRouter(store: CarStore): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const parsed = CarQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", issues: parsed.error.issues });
      return;
    }
    res.json(store.query(parsed.data as CarQuery));
  });

  router.get("/:id", (req, res) => {
    const vehicle = store.byId(req.params.id);
    if (!vehicle) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }
    res.json(vehicle);
  });

  return router;
}

/** Mounted at /api/compare — resolve ≤4 ids, 404 on any unknown id. */
export function compareRouter(store: CarStore): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const parsed = CompareSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", issues: parsed.error.issues });
      return;
    }
    // Validate every requested id first (404 on the first unknown), then take
    // the first 4 valid ids for the actual comparison.
    for (const id of parsed.data.ids) {
      if (!store.byId(id)) {
        res.status(404).json({ error: `Unknown carId: ${id}` });
        return;
      }
    }
    const ids = parsed.data.ids.slice(0, 4);
    res.json({ items: store.compare(ids) });
  });

  return router;
}
