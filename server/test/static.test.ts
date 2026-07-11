import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { testStore } from "./helpers";
import { createApp } from "../src/app";

const INDEX_HTML = "<!doctype html><html><body><div id=\"root\">VoltList SPA</div></body></html>";

describe("static serving (production mode)", () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "voltlist-web-"));
    writeFileSync(join(dir, "index.html"), INDEX_HTML);
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("serves index.html for an unknown non-api path (SPA fallback)", async () => {
    const app = createApp(testStore(), { serveStatic: true, webDistPath: dir });
    const res = await request(app).get("/catalog/some/deep/link");
    expect(res.status).toBe(200);
    expect(res.text).toContain("VoltList SPA");
  });

  it("still returns JSON 404 for unknown /api routes", async () => {
    const app = createApp(testStore(), { serveStatic: true, webDistPath: dir });
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not found");
  });

  it("still serves the API in production mode", async () => {
    const app = createApp(testStore(), { serveStatic: true, webDistPath: dir });
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("does NOT force HTTPS upgrades (works over plain HTTP on a LAN)", async () => {
    // Regression: helmet's default `upgrade-insecure-requests` made browsers rewrite
    // asset requests to https:// on an http:// host, breaking the SPA (blank page).
    const app = createApp(testStore(), { serveStatic: true, webDistPath: dir });
    const res = await request(app).get("/");
    const csp = res.headers["content-security-policy"] ?? "";
    expect(csp).not.toContain("upgrade-insecure-requests");
    // But core CSP protections are still enforced.
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
  });
});
