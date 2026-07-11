import { describe, it, expect } from "vitest";
import request from "supertest";
import { testApp } from "./helpers";

const app = testApp();

describe("GET /api/cars", () => {
  it("returns the full list with pagination + facets", async () => {
    const res = await request(app).get("/api/cars");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(res.body.items).toHaveLength(5);
    expect(res.body.facets.makes).toContain("Tesla");
  });

  it("filters by powertrain via querystring", async () => {
    const res = await request(app).get("/api/cars?powertrain=BEV");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
  });

  it("filters by comma-separated drivetrain and sorts by price", async () => {
    const res = await request(app).get("/api/cars?drivetrain=AWD,RWD&sort=price&order=asc");
    expect(res.status).toBe(200);
    const prices = res.body.items.map((v: { msrpBaseUsd: number }) => v.msrpBaseUsd);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("rejects an invalid sort key with 400 + issues", async () => {
    const res = await request(app).get("/api/cars?sort=bogus");
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.issues).toBeDefined();
  });

  it("treats a blank numeric param as absent (no coerce-to-0 filter)", async () => {
    // maxPrice="" must be a no-op, not maxPrice=0 which would exclude everything.
    const res = await request(app).get("/api/cars?maxPrice=&minPrice=&minElectricRange=&minSeating=");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(res.body.items).toHaveLength(5);
  });

  it("treats blank page/pageSize as absent", async () => {
    const res = await request(app).get("/api/cars?page=&pageSize=");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(res.body.page).toBe(1);
  });

  it("filters by bodyStyle (exact enum value)", async () => {
    const res = await request(app).get("/api/cars?bodyStyle=SUV");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].bodyStyle).toBe("SUV");
  });

  it("rejects a wrong-case bodyStyle with 400 instead of silently returning nothing", async () => {
    const res = await request(app).get("/api/cars?bodyStyle=suv");
    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
  });

  it("rejects a wrong-case chargePort with 400", async () => {
    const res = await request(app).get("/api/cars?chargePort=nacs");
    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
  });
});

describe("GET /api/cars/:id", () => {
  it("returns a vehicle by id", async () => {
    const res = await request(app).get("/api/cars/tesla-model-3-2025");
    expect(res.status).toBe(200);
    expect(res.body.make).toBe("Tesla");
    expect(res.body.adas.laneKeepAssist).toBe("Standard");
  });

  it("404s for an unknown id", async () => {
    const res = await request(app).get("/api/cars/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/compare", () => {
  it("returns up to 4 vehicles by ids", async () => {
    const res = await request(app).get("/api/compare?ids=tesla-model-3-2025,toyota-camry-2025");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
  });

  it("404s when any id is unknown", async () => {
    const res = await request(app).get("/api/compare?ids=tesla-model-3-2025,nope");
    expect(res.status).toBe(404);
  });

  it("caps at 4 ids", async () => {
    const res = await request(app).get(
      "/api/compare?ids=tesla-model-3-2025,ford-f-150-lightning-2025,toyota-rav4-prime-2025,toyota-camry-2025,hyundai-ioniq-5-2026",
    );
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(4);
  });
});
