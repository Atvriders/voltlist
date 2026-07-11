import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import Compare from "./Compare";
import { renderWithProviders } from "../test/utils";
import { server } from "../test/msw/server";
import { bevFixture, phevFixture } from "../test/fixtures";

describe("Compare page", () => {
  it("compares the cart cars as columns with export actions", async () => {
    server.use(
      http.get("*/api/cart", () =>
        HttpResponse.json({ carIds: [bevFixture.id, phevFixture.id] }),
      ),
    );
    renderWithProviders(<Compare />, { route: "/compare" });

    // Two car columns sourced from the cart.
    expect(
      await screen.findByRole("link", { name: "Ioniq 5" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RAV4 Prime" })).toBeInTheDocument();

    // Export buttons target the cart export endpoint.
    expect(screen.getByRole("link", { name: "Export CSV" })).toHaveAttribute(
      "href",
      "/api/export/cart?format=csv",
    );
    expect(screen.getByRole("link", { name: "Export PDF" })).toHaveAttribute(
      "href",
      "/api/export/cart?format=pdf",
    );

    // Best-in-row marking flows through into the rendered matrix.
    const row = screen.getByTestId("compare-row-electricRange");
    expect(within(row).getAllByRole("cell")[0]).toHaveTextContent(
      /best in row/i,
    );
  });

  it("shows an empty state when there is nothing to compare", async () => {
    renderWithProviders(<Compare />, { route: "/compare" });
    expect(
      await screen.findByText(/No vehicles to compare yet/i),
    ).toBeInTheDocument();
  });

  it("compares vehicles named in the ids query param", async () => {
    // Cart is non-empty, but a deep-link must ignore it entirely.
    server.use(
      http.get("*/api/cart", () => HttpResponse.json({ carIds: ["someone-else"] })),
    );
    renderWithProviders(<Compare />, {
      route: `/compare?ids=${bevFixture.id},${phevFixture.id}`,
    });
    expect(
      await screen.findByRole("link", { name: "Ioniq 5" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RAV4 Prime" })).toBeInTheDocument();

    // Export targets the public ids endpoint with the on-screen ids — NOT the
    // signed-in cart export.
    const idsParam = `${bevFixture.id},${phevFixture.id}`;
    expect(screen.getByRole("link", { name: "Export CSV" })).toHaveAttribute(
      "href",
      `/api/export/compare?ids=${idsParam}&format=csv`,
    );
    expect(screen.getByRole("link", { name: "Export PDF" })).toHaveAttribute(
      "href",
      `/api/export/compare?ids=${idsParam}&format=pdf`,
    );
  });
});
