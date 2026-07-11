import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router-dom";
import Account from "./Account";
import { renderWithProviders } from "../test/utils";
import { server } from "../test/msw/server";

/** Signs the session in by overriding the default (401) `/api/auth/me`. */
function signIn(email = "driver@volt.test") {
  server.use(
    http.get("*/api/auth/me", () =>
      HttpResponse.json({ user: { id: "u1", email } }),
    ),
  );
}

describe("Account", () => {
  it("shows the signed-in email", async () => {
    signIn("driver@volt.test");
    renderWithProviders(<Account />, { route: "/account" });
    expect(await screen.findByText("driver@volt.test")).toBeInTheDocument();
  });

  it("logs out and returns to the catalog", async () => {
    signIn();
    let logoutCalled = false;
    server.use(
      http.post("*/api/auth/logout", () => {
        logoutCalled = true;
        return HttpResponse.json({ ok: true });
      }),
    );

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/account" element={<Account />} />
        <Route path="/" element={<div>CATALOG PAGE</div>} />
      </Routes>,
      { route: "/account" },
    );

    await screen.findByText("driver@volt.test");
    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(logoutCalled).toBe(true));
    expect(await screen.findByText("CATALOG PAGE")).toBeInTheDocument();
  });
});
