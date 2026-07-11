import { describe, it, expect } from "vitest";
import { testStore } from "./helpers";

const store = testStore();

describe("CarStore.loadCars / count", () => {
  it("loads and validates all fixture vehicles", () => {
    expect(store.count).toBe(5);
  });
});

describe("CarStore.query filtering", () => {
  it("filters by powertrain", () => {
    const bev = store.query({ powertrain: ["BEV"] });
    expect(bev.total).toBe(3);
    expect(bev.items.every((v) => v.powertrainType === "BEV")).toBe(true);

    const phev = store.query({ powertrain: ["PHEV"] });
    expect(phev.total).toBe(1);
    expect(phev.items[0]!.id).toBe("toyota-rav4-prime-2025");
  });

  it("filters by drivetrain", () => {
    expect(store.query({ drivetrain: ["FWD"] }).total).toBe(1);
    expect(store.query({ drivetrain: ["AWD"] }).total).toBe(3);
  });

  it("filters by minElectricRange (nulls excluded)", () => {
    const r = store.query({ minElectricRange: 300 });
    expect(r.items.map((v) => v.id).sort()).toEqual(["ford-f-150-lightning-2025", "tesla-model-3-2025"]);
  });

  it("filters by needsLaneAssist (excludes NotAvailable)", () => {
    const r = store.query({ needsLaneAssist: true });
    expect(r.total).toBe(4);
    expect(r.items.some((v) => v.id === "toyota-camry-2025")).toBe(false);
  });

  it("filters by needsHandsFree", () => {
    const r = store.query({ needsHandsFree: true });
    expect(r.items.map((v) => v.id)).toEqual(["ford-f-150-lightning-2025"]);
  });

  it("full-text search over make/model/segment", () => {
    expect(store.query({ q: "toyota" }).total).toBe(2);
    expect(store.query({ q: "camry" }).items.map((v) => v.id)).toEqual(["toyota-camry-2025"]);
  });
});

describe("CarStore.query sorting", () => {
  it("sorts by price ascending and descending", () => {
    const asc = store.query({ sort: "price", order: "asc" }).items.map((v) => v.msrpBaseUsd);
    expect(asc).toEqual([29000, 42000, 45000, 46000, 62000]);

    const desc = store.query({ sort: "price", order: "desc" }).items.map((v) => v.msrpBaseUsd);
    expect(desc).toEqual([62000, 46000, 45000, 42000, 29000]);
  });

  it("sorts nulls last (electric range on an HEV)", () => {
    const ids = store.query({ sort: "range", order: "desc" }).items.map((v) => v.id);
    // Camry has null electricRangeMi → must be last.
    expect(ids[ids.length - 1]).toBe("toyota-camry-2025");
  });
});

describe("CarStore.query pagination + facets", () => {
  it("paginates with correct totals", () => {
    const p1 = store.query({ pageSize: 2, page: 1 });
    expect(p1.items).toHaveLength(2);
    expect(p1.total).toBe(5);
    expect(p1.page).toBe(1);
    expect(p1.pageSize).toBe(2);

    const p3 = store.query({ pageSize: 2, page: 3 });
    expect(p3.items).toHaveLength(1);
    expect(p3.total).toBe(5);
  });

  it("returns facet universe", () => {
    const { facets } = store.query({});
    expect(facets.makes).toEqual(["Ford", "Hyundai", "Tesla", "Toyota"]);
    expect(facets.bodyStyles).toContain("Truck");
  });
});

describe("CarStore.byId / compare", () => {
  it("byId returns undefined for unknown id", () => {
    expect(store.byId("nope")).toBeUndefined();
    expect(store.byId("tesla-model-3-2025")?.make).toBe("Tesla");
  });

  it("compare caps at 4 and drops unknown ids", () => {
    const all = store.vehicles.map((v) => v.id);
    expect(store.compare([...all, "extra"])).toHaveLength(4);
    expect(store.compare(["tesla-model-3-2025", "nope"]).map((v) => v.id)).toEqual(["tesla-model-3-2025"]);
  });
});
