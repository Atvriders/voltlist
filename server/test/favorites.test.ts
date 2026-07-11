import { describe, it, expect } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { testApp } from "./helpers";

async function registeredAgent(app: Express, email: string) {
  const agent = request.agent(app);
  await agent.post("/api/auth/register").send({ email, password: "password123" }).expect(201);
  return agent;
}

describe("favorites", () => {
  it("requires auth", async () => {
    const res = await request(testApp()).get("/api/favorites");
    expect(res.status).toBe(401);
  });

  it("adds, lists, and deletes; add is idempotent", async () => {
    const app = testApp();
    const agent = await registeredAgent(app, "fav@example.com");

    let res = await agent.post("/api/favorites").send({ carId: "tesla-model-3-2025" });
    expect(res.status).toBe(200);
    expect(res.body.carIds).toEqual(["tesla-model-3-2025"]);

    // idempotent (unique constraint upsert)
    res = await agent.post("/api/favorites").send({ carId: "tesla-model-3-2025" });
    expect(res.body.carIds).toEqual(["tesla-model-3-2025"]);

    res = await agent.post("/api/favorites").send({ carId: "toyota-camry-2025" });
    expect(res.body.carIds.sort()).toEqual(["tesla-model-3-2025", "toyota-camry-2025"]);

    res = await agent.get("/api/favorites");
    expect(res.body.carIds).toHaveLength(2);

    res = await agent.delete("/api/favorites/tesla-model-3-2025");
    expect(res.body.carIds).toEqual(["toyota-camry-2025"]);
  });

  it("404s on unknown carId", async () => {
    const app = testApp();
    const agent = await registeredAgent(app, "fav2@example.com");
    const res = await agent.post("/api/favorites").send({ carId: "not-a-real-car" });
    expect(res.status).toBe(404);
  });

  it("isolates favorites per user", async () => {
    const app = testApp();
    const alice = await registeredAgent(app, "alice-fav@example.com");
    const bob = await registeredAgent(app, "bob-fav@example.com");

    await alice.post("/api/favorites").send({ carId: "tesla-model-3-2025" }).expect(200);

    const bobList = await bob.get("/api/favorites");
    expect(bobList.body.carIds).toEqual([]);
  });
});
