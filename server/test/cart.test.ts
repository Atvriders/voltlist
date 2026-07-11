import { describe, it, expect } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { testApp } from "./helpers";

async function registeredAgent(app: Express, email: string) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ email, password: "password123" }).expect(201);
  return agent;
}

describe("cart", () => {
  it("requires auth", async () => {
    const res = await request(testApp()).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("adds, lists, and deletes items", async () => {
    const app = testApp();
    const agent = await registeredAgent(app, "cart@example.com");

    let res = await agent.post("/api/cart").send({ carId: "ford-f-150-lightning-2025" });
    expect(res.status).toBe(200);
    expect(res.body.carIds).toEqual(["ford-f-150-lightning-2025"]);

    res = await agent.post("/api/cart").send({ carId: "hyundai-ioniq-5-2026" });
    expect(res.body.carIds).toEqual(["ford-f-150-lightning-2025", "hyundai-ioniq-5-2026"]);

    res = await agent.delete("/api/cart/ford-f-150-lightning-2025");
    expect(res.body.carIds).toEqual(["hyundai-ioniq-5-2026"]);
  });

  it("404s on unknown carId", async () => {
    const app = testApp();
    const agent = await registeredAgent(app, "cart2@example.com");
    const res = await agent.post("/api/cart").send({ carId: "ghost-car" });
    expect(res.status).toBe(404);
  });

  it("isolates cart per user", async () => {
    const app = testApp();
    const a = await registeredAgent(app, "a-cart@example.com");
    const b = await registeredAgent(app, "b-cart@example.com");
    await a.post("/api/cart").send({ carId: "tesla-model-3-2025" }).expect(200);
    const bList = await b.get("/api/cart");
    expect(bList.body.carIds).toEqual([]);
  });
});
