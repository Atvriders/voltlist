import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { AppRoutes } from "./router";
import { renderWithProviders } from "./test/utils";

describe("AppRoutes", () => {
  it("renders the Catalog page at /", async () => {
    renderWithProviders(<AppRoutes />, { route: "/" });
    expect(
      await screen.findByRole("heading", { name: "Catalog" }),
    ).toBeInTheDocument();
  });

  it("redirects a protected route to /login when unauthenticated", async () => {
    renderWithProviders(<AppRoutes />, { route: "/favorites" });
    // me → 401 → not authenticated → redirect to the Login page.
    expect(
      await screen.findByRole("heading", { name: "Login" }),
    ).toBeInTheDocument();
  });
});
