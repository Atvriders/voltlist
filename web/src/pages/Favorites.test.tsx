import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import Favorites from "./Favorites";
import { renderWithProviders } from "../test/utils";
import { server } from "../test/msw/server";
import { bevFixture, hevFixture } from "../test/fixtures";

describe("Favorites page", () => {
  it("renders a SpecCard for each favorited car and shows the count", async () => {
    server.use(
      http.get("*/api/favorites", () =>
        HttpResponse.json({ carIds: [bevFixture.id, hevFixture.id] }),
      ),
    );

    renderWithProviders(<Favorites />);

    // One SpecCard per favorite (the model renders as a link to its detail page).
    expect(
      await screen.findByRole("link", { name: "Ioniq 5" }),
    ).toHaveAttribute("href", `/car/${bevFixture.id}`);
    expect(
      await screen.findByRole("link", { name: "Camry Hybrid" }),
    ).toHaveAttribute("href", `/car/${hevFixture.id}`);

    expect(screen.getByText("2 cars saved")).toBeInTheDocument();
  });

  it("shows an empty state (with a catalog link) when there are no favorites", async () => {
    // Baseline handler already returns { carIds: [] }.
    renderWithProviders(<Favorites />);

    expect(
      await screen.findByText(/No favorites yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Browse the catalog/i }),
    ).toHaveAttribute("href", "/");
  });
});
