import { http, HttpResponse } from "msw";
import type { CarListResult, Vehicle } from "@voltlist/shared";
import { carFixtures } from "../fixtures";

/**
 * Baseline mock API for tests. Page-agent tests can override any of these per
 * test with `server.use(...)`. `/api/auth/me` returns 401 (logged out) by
 * default; favorites/cart return empty lists.
 */

function filterCars(url: URL): CarListResult {
  const p = url.searchParams;
  const arr = (k: string) => p.getAll(k);
  const num = (k: string) => (p.has(k) ? Number(p.get(k)) : undefined);

  const powertrain = arr("powertrain");
  const make = arr("make");
  const bodyStyle = arr("bodyStyle");
  const drivetrain = arr("drivetrain");
  const chargePort = arr("chargePort");
  const q = p.get("q")?.toLowerCase();
  const minPrice = num("minPrice");
  const maxPrice = num("maxPrice");
  const minElectricRange = num("minElectricRange");
  const minSeating = num("minSeating");

  let items = carFixtures.filter((c) => {
    if (powertrain.length && !powertrain.includes(c.powertrainType)) return false;
    if (make.length && !make.includes(c.make)) return false;
    if (bodyStyle.length && !bodyStyle.includes(c.bodyStyle)) return false;
    if (drivetrain.length && !drivetrain.includes(c.drivetrain)) return false;
    if (chargePort.length && (c.chargePort == null || !chargePort.includes(c.chargePort)))
      return false;
    if (minPrice != null && (c.msrpBaseUsd ?? 0) < minPrice) return false;
    if (maxPrice != null && (c.msrpBaseUsd ?? Infinity) > maxPrice) return false;
    if (minElectricRange != null && (c.electricRangeMi ?? 0) < minElectricRange)
      return false;
    if (minSeating != null && (c.seatingCapacity ?? 0) < minSeating) return false;
    if (
      q &&
      !`${c.make} ${c.model} ${c.segment}`.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  const sort = p.get("sort");
  const order = p.get("order") === "desc" ? -1 : 1;
  if (sort) {
    const key = (c: Vehicle): number => {
      switch (sort) {
        case "price":
          return c.msrpBaseUsd ?? 0;
        case "range":
          return c.electricRangeMi ?? c.totalRangeMi ?? 0;
        case "zeroToSixty":
          return c.zeroToSixtySec ?? 0;
        case "efficiency":
          return c.mpge ?? c.efficiencyMiPerKwh ?? 0;
        case "horsepower":
          return c.horsepower ?? 0;
        default:
          return 0;
      }
    };
    items = [...items].sort((a, b) => (key(a) - key(b)) * order);
  }

  const total = items.length;
  const page = num("page") ?? 1;
  const pageSize = num("pageSize") ?? 24;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    items: paged,
    total,
    page,
    pageSize,
    facets: {
      makes: [...new Set(carFixtures.map((c) => c.make))].sort(),
      bodyStyles: [...new Set(carFixtures.map((c) => c.bodyStyle))].sort(),
    },
  };
}

export const handlers = [
  http.get("*/api/health", () =>
    HttpResponse.json({ ok: true, cars: carFixtures.length }),
  ),

  http.get("*/api/cars", ({ request }) =>
    HttpResponse.json(filterCars(new URL(request.url))),
  ),

  http.get("*/api/cars/:id", ({ params }) => {
    const car = carFixtures.find((c) => c.id === params.id);
    return car
      ? HttpResponse.json(car)
      : HttpResponse.json({ error: "Not found" }, { status: 404 });
  }),

  http.get("*/api/compare", ({ request }) => {
    const ids = (new URL(request.url).searchParams.get("ids") ?? "")
      .split(",")
      .filter(Boolean)
      .slice(0, 4);
    const items = ids
      .map((id) => carFixtures.find((c) => c.id === id))
      .filter((c): c is Vehicle => Boolean(c));
    return HttpResponse.json({ items });
  }),

  // Auth — logged out by default.
  http.get("*/api/auth/me", () =>
    HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
  ),
  http.post("*/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string };
    return HttpResponse.json({ user: { id: "test-user", email: body.email } });
  }),
  http.post("*/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as { email: string };
    return HttpResponse.json({ user: { id: "test-user", email: body.email } });
  }),
  http.post("*/api/auth/logout", () => HttpResponse.json({ ok: true })),

  // Favorites & cart — empty baseline; override per test as needed.
  http.get("*/api/favorites", () => HttpResponse.json({ carIds: [] })),
  http.post("*/api/favorites", async ({ request }) => {
    const body = (await request.json()) as { carId: string };
    return HttpResponse.json({ carIds: [body.carId] });
  }),
  http.delete("*/api/favorites/:carId", () => HttpResponse.json({ carIds: [] })),

  http.get("*/api/cart", () => HttpResponse.json({ carIds: [] })),
  http.post("*/api/cart", async ({ request }) => {
    const body = (await request.json()) as { carId: string };
    return HttpResponse.json({ carIds: [body.carId] });
  }),
  http.delete("*/api/cart/:carId", () => HttpResponse.json({ carIds: [] })),
];
