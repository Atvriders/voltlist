import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import Login from "./Login";
import { renderWithProviders } from "../test/utils";
import { server } from "../test/msw/server";

/** Login rendered alongside a Catalog placeholder so we can assert the redirect. */
function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<div>CATALOG PAGE</div>} />
      <Route path="/register" element={<div>REGISTER PAGE</div>} />
    </Routes>,
    { route: "/login" },
  );
}

describe("Login", () => {
  it("submits valid credentials to the login endpoint and redirects to the catalog", async () => {
    let body: { email: string; password: string } | null = null;
    server.use(
      http.post("*/api/auth/login", async ({ request }) => {
        body = (await request.json()) as { email: string; password: string };
        return HttpResponse.json({ user: { id: "u1", email: body.email } });
      }),
    );

    const { user } = renderLogin();
    await user.type(screen.getByLabelText("Email"), "driver@volt.test");
    await user.type(screen.getByLabelText("Password"), "supersecret");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(body).toEqual({
        email: "driver@volt.test",
        password: "supersecret",
      }),
    );
    expect(await screen.findByText("CATALOG PAGE")).toBeInTheDocument();
  });

  it("shows a validation error for a bad email and never calls the API", async () => {
    let called = false;
    server.use(
      http.post("*/api/auth/login", () => {
        called = true;
        return HttpResponse.json({ user: { id: "u1", email: "x" } });
      }),
    );

    const { user } = renderLogin();
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "supersecret");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(called).toBe(false);
    expect(screen.queryByText("CATALOG PAGE")).not.toBeInTheDocument();
  });

  it("surfaces the server error message when credentials are rejected", async () => {
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json(
          { error: "Invalid email or password." },
          { status: 401 },
        ),
      ),
    );

    const { user } = renderLogin();
    await user.type(screen.getByLabelText("Email"), "driver@volt.test");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
    expect(screen.queryByText("CATALOG PAGE")).not.toBeInTheDocument();
  });
});
