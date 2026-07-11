import { describe, it, expect } from "vitest";
import request from "supertest";
import { testApp } from "./helpers";

const app = testApp();

describe("auth flow", () => {
  it("register sets an httpOnly SameSite=Lax cookie and returns the user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "Alice@Example.com", password: "supersecret" });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("alice@example.com");
    expect(res.body.user.id).toBeTruthy();

    const setCookie = res.headers["set-cookie"];
    const cookie = Array.isArray(setCookie) ? setCookie[0] : String(setCookie);
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    // Secure is off unless COOKIE_SECURE=true (unset here), so the login cookie
    // works over plain HTTP; a Secure cookie would be dropped by browsers on HTTP.
    expect(cookie).not.toMatch(/Secure/i);
  });

  it("register → me happy path via cookie", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email: "bob@example.com", password: "password123" }).expect(201);
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("bob@example.com");
  });

  it("rejects duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send({ email: "dup@example.com", password: "password123" }).expect(201);
    const res = await request(app).post("/api/auth/register").send({ email: "dup@example.com", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("rejects a short password with 400 + issues", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "short@example.com", password: "x" });
    expect(res.status).toBe(400);
    expect(res.body.issues).toBeDefined();
  });

  it("login succeeds with correct password and 401s on wrong password", async () => {
    await request(app).post("/api/auth/register").send({ email: "carol@example.com", password: "password123" }).expect(201);

    const ok = await request(app).post("/api/auth/login").send({ email: "carol@example.com", password: "password123" });
    expect(ok.status).toBe(200);
    expect(ok.body.user.email).toBe("carol@example.com");

    const bad = await request(app).post("/api/auth/login").send({ email: "carol@example.com", password: "wrongpass1" });
    expect(bad.status).toBe(401);
  });

  it("login for a non-existent account returns the same generic 401 (no enumeration)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "ghost@example.com", password: "password123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("me without cookie is 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("logout clears the cookie", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email: "dave@example.com", password: "password123" }).expect(201);
    await agent.post("/api/auth/logout").expect(200);
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(401);
  });
});
