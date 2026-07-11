import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import Register from "./Register";
import { renderWithProviders } from "../test/utils";
import { server } from "../test/msw/server";

function renderRegister() {
  return renderWithProviders(
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<div>CATALOG PAGE</div>} />
      <Route path="/login" element={<div>LOGIN PAGE</div>} />
    </Routes>,
    { route: "/register" },
  );
}

describe("Register", () => {
  it("creates the account and redirects to the catalog", async () => {
    let body: { email: string; password: string } | null = null;
    server.use(
      http.post("*/api/auth/register", async ({ request }) => {
        body = (await request.json()) as { email: string; password: string };
        return HttpResponse.json({ user: { id: "u1", email: body.email } });
      }),
    );

    const { user } = renderRegister();
    await user.type(screen.getByLabelText("Email"), "new@volt.test");
    await user.type(screen.getByLabelText("Password"), "supersecret");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(body).toEqual({ email: "new@volt.test", password: "supersecret" }),
    );
    expect(await screen.findByText("CATALOG PAGE")).toBeInTheDocument();
  });

  it("rejects a short password client-side without calling the API", async () => {
    let called = false;
    server.use(
      http.post("*/api/auth/register", () => {
        called = true;
        return HttpResponse.json({ user: { id: "u1", email: "x" } });
      }),
    );

    const { user } = renderRegister();
    await user.type(screen.getByLabelText("Email"), "new@volt.test");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Use at least 8 characters."),
    ).toBeInTheDocument();
    expect(called).toBe(false);
    expect(screen.queryByText("CATALOG PAGE")).not.toBeInTheDocument();
  });

  it("surfaces the duplicate-email error from the server", async () => {
    server.use(
      http.post("*/api/auth/register", () =>
        HttpResponse.json(
          { error: "That email is already registered." },
          { status: 409 },
        ),
      ),
    );

    const { user } = renderRegister();
    await user.type(screen.getByLabelText("Email"), "taken@volt.test");
    await user.type(screen.getByLabelText("Password"), "supersecret");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That email is already registered.",
    );
  });
});
