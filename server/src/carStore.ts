import { readFileSync } from "node:fs";
import { Vehicle } from "@voltlist/shared";
import type { CarQuery, CarListResult, Facets } from "@voltlist/shared";

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;
const COMPARE_CAP = 4;

/**
 * Read a cars JSON file, validating every entry against the frozen Vehicle
 * schema. Throws on the first invalid entry (or malformed file) so a bad
 * dataset fails loudly at boot instead of serving garbage.
 */
export function loadCars(path: string): Vehicle[] {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(raw)) {
    throw new Error(`cars file at ${path} must contain a JSON array`);
  }
  return raw.map((entry, i) => {
    const result = Vehicle.safeParse(entry);
    if (!result.success) {
      throw new Error(
        `cars file at ${path}: invalid vehicle at index ${i}: ${result.error.issues
          .map((iss) => `${iss.path.join(".") || "(root)"}: ${iss.message}`)
          .join("; ")}`,
      );
    }
    return result.data;
  });
}

type SortAccessor = (v: Vehicle) => number | null;

const SORT_ACCESSORS: Record<NonNullable<CarQuery["sort"]>, SortAccessor> = {
  price: (v) => v.msrpBaseUsd,
  range: (v) => v.electricRangeMi,
  zeroToSixty: (v) => v.zeroToSixtySec,
  efficiency: (v) => v.mpge,
  horsepower: (v) => v.horsepower,
};

function includes(list: readonly string[] | undefined, value: string): boolean {
  return !list || list.length === 0 || list.includes(value);
}

/** Nulls always sort to the end regardless of asc/desc. */
function compareNullable(a: number | null, b: number | null, dir: 1 | -1): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return (a - b) * dir;
}

export class CarStore {
  readonly vehicles: Vehicle[];
  private readonly index: Map<string, Vehicle>;
  private readonly facetCache: Facets;

  constructor(vehicles: Vehicle[]) {
    this.vehicles = vehicles;
    this.index = new Map(vehicles.map((v) => [v.id, v]));
    this.facetCache = {
      makes: [...new Set(vehicles.map((v) => v.make))].sort((a, b) => a.localeCompare(b)),
      bodyStyles: [...new Set(vehicles.map((v) => v.bodyStyle))].sort((a, b) => a.localeCompare(b)),
    };
  }

  get count(): number {
    return this.vehicles.length;
  }

  byId(id: string): Vehicle | undefined {
    return this.index.get(id);
  }

  /** Resolve up to COMPARE_CAP ids to vehicles, dropping unknown ids. */
  compare(ids: string[]): Vehicle[] {
    return ids
      .slice(0, COMPARE_CAP)
      .map((id) => this.index.get(id))
      .filter((v): v is Vehicle => v !== undefined);
  }

  private matches(v: Vehicle, q: CarQuery): boolean {
    if (q.q) {
      const needle = q.q.toLowerCase();
      const haystack = `${v.make} ${v.model} ${v.segment}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (q.powertrain && q.powertrain.length > 0 && !q.powertrain.includes(v.powertrainType)) return false;
    if (q.make && q.make.length > 0 && !q.make.some((m) => m.toLowerCase() === v.make.toLowerCase())) return false;
    if (!includes(q.bodyStyle, v.bodyStyle)) return false;
    if (q.drivetrain && q.drivetrain.length > 0 && !q.drivetrain.includes(v.drivetrain)) return false;
    if (q.chargePort && q.chargePort.length > 0) {
      if (v.chargePort == null || !q.chargePort.includes(v.chargePort)) return false;
    }
    if (q.minPrice != null && (v.msrpBaseUsd == null || v.msrpBaseUsd < q.minPrice)) return false;
    if (q.maxPrice != null && (v.msrpBaseUsd == null || v.msrpBaseUsd > q.maxPrice)) return false;
    if (q.minElectricRange != null && (v.electricRangeMi == null || v.electricRangeMi < q.minElectricRange)) return false;
    if (q.minSeating != null && (v.seatingCapacity == null || v.seatingCapacity < q.minSeating)) return false;
    if (q.taxCreditOnly && v.federalTaxCreditEligible !== true) return false;
    if (q.needsAdaptiveCruise && v.adas.adaptiveCruiseControl === "NotAvailable") return false;
    if (q.needsLaneAssist && v.adas.laneKeepAssist === "NotAvailable") return false;
    if (q.needsHandsFree && v.adas.handsFreeHighway === "NotAvailable") return false;
    return true;
  }

  query(q: CarQuery = {}): CarListResult {
    const filtered = this.vehicles.filter((v) => this.matches(v, q));

    if (q.sort) {
      const accessor = SORT_ACCESSORS[q.sort];
      const dir: 1 | -1 = q.order === "desc" ? -1 : 1;
      filtered.sort((a, b) => compareNullable(accessor(a), accessor(b), dir));
    }

    const total = filtered.length;
    const pageSize = Math.min(Math.max(q.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const page = Math.max(q.page ?? 1, 1);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return { items, total, page, pageSize, facets: this.facetCache };
  }
}
