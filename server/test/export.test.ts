import { describe, it, expect } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { testApp } from "./helpers";

async function agentWithCart(app: Express, email: string, carIds: string[]) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ email, password: "password123" }).expect(201);
  for (const carId of carIds) {
    await agent.post("/api/cart").send({ carId }).expect(200);
  }
  return agent;
}

describe("GET /api/export/cart", () => {
  it("requires auth", async () => {
    const res = await request(testApp()).get("/api/export/cart?format=csv");
    expect(res.status).toBe(401);
  });

  it("400s on empty cart", async () => {
    const agent = request.agent(testApp());
    await agent.post("/api/auth/register").send({ email: "empty@example.com", password: "password123" }).expect(201);
    const res = await agent.get("/api/export/cart?format=csv");
    expect(res.status).toBe(400);
  });

  it("400s on a bad format", async () => {
    const app = testApp();
    const agent = await agentWithCart(app, "badfmt@example.com", ["tesla-model-3-2025"]);
    const res = await agent.get("/api/export/cart?format=xml");
    expect(res.status).toBe(400);
  });

  it("exports CSV with cart ids and a known spec value", async () => {
    const app = testApp();
    const agent = await agentWithCart(app, "csv@example.com", ["tesla-model-3-2025", "toyota-camry-2025"]);
    const res = await agent.get("/api/export/cart?format=csv");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.text).toContain("tesla-model-3-2025");
    expect(res.text).toContain("toyota-camry-2025");
    // Tesla Model 3 electric range column value.
    expect(res.text).toContain("363");
  });

  it("exports a non-empty PDF", async () => {
    const app = testApp();
    const agent = await agentWithCart(app, "pdf@example.com", ["tesla-model-3-2025"]);
    const res = await agent.get("/api/export/cart?format=pdf").buffer(true).parse((r, cb) => {
      const chunks: Buffer[] = [];
      r.on("data", (c: Buffer) => chunks.push(c));
      r.on("end", () => cb(null, Buffer.concat(chunks)));
    });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    const body = res.body as Buffer;
    expect(body.length).toBeGreaterThan(0);
    expect(body.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});

describe("GET /api/export/compare (public, no auth)", () => {
  it("exports CSV for ?ids= without any auth cookie", async () => {
    const res = await request(testApp()).get(
      "/api/export/compare?format=csv&ids=tesla-model-3-2025,toyota-camry-2025",
    );
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("voltlist-compare.csv");
    expect(res.text).toContain("tesla-model-3-2025");
    expect(res.text).toContain("toyota-camry-2025");
    // Tesla Model 3 electric range column value.
    expect(res.text).toContain("363");
  });

  it("exports a non-empty PDF for ?ids= without any auth cookie", async () => {
    const res = await request(testApp())
      .get("/api/export/compare?format=pdf&ids=tesla-model-3-2025")
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on("data", (c: Buffer) => chunks.push(c));
        r.on("end", () => cb(null, Buffer.concat(chunks)));
      });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.headers["content-disposition"]).toContain("voltlist-compare.pdf");
    const body = res.body as Buffer;
    expect(body.length).toBeGreaterThan(0);
    expect(body.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("caps at 4 vehicles when more than 4 ids are supplied", async () => {
    const res = await request(testApp()).get(
      "/api/export/compare?format=csv&ids=tesla-model-3-2025,ford-f-150-lightning-2025,toyota-rav4-prime-2025,toyota-camry-2025,hyundai-ioniq-5-2026",
    );
    expect(res.status).toBe(200);
    // Header row + 4 data rows (5th id dropped by the cap).
    const dataRows = res.text.trim().split("\r\n").slice(1);
    expect(dataRows).toHaveLength(4);
    expect(res.text).not.toContain("hyundai-ioniq-5-2026");
  });

  it("404s when any id is unknown", async () => {
    const res = await request(testApp()).get("/api/export/compare?format=csv&ids=tesla-model-3-2025,nope");
    expect(res.status).toBe(404);
  });

  it("400s when no ids are supplied", async () => {
    const res = await request(testApp()).get("/api/export/compare?format=csv");
    expect(res.status).toBe(400);
  });
});
