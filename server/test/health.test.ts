import { describe, it, expect } from "vitest";
import request from "supertest";
import { testApp } from "./helpers";

describe("GET /api/health", () => {
  it("returns ok with the car count", async () => {
    const res = await request(testApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, cars: 5 });
  });
});
