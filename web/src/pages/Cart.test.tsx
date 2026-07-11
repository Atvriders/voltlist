import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import Cart from "./Cart";
import { renderWithProviders } from "../test/utils";
import { server } from "../test/msw/server";
import { bevFixture, phevFixture } from "../test/fixtures";

describe("Cart page", () => {
  it("lists each shortlisted car, shows the count, and offers compare + export", async () => {
    server.use(
      http.get("*/api/cart", () =>
        HttpResponse.json({ carIds: [bevFixture.id, phevFixture.id] }),
      ),
    );

    renderWithProviders(<Cart />);

    expect(await screen.findByText("Ioniq 5")).toBeInTheDocument();
    expect(await screen.findByText("RAV4 Prime")).toBeInTheDocument();

    // Count reflects the two mocked cars.
    expect(screen.getByTestId("cart-count")).toHaveTextContent("2 cars");

    // Compare button (capped at 4) links to the compare matrix.
    expect(
      screen.getByRole("link", { name: /Compare 2/ }),
    ).toHaveAttribute("href", "/compare");

    // Export deep-links to the server endpoints.
    expect(
      screen.getByRole("link", { name: /Export CSV/i }),
    ).toHaveAttribute("href", "/api/export/cart?format=csv");
    expect(
      screen.getByRole("link", { name: /Export PDF/i }),
    ).toHaveAttribute("href", "/api/export/cart?format=pdf");
  });

  it("removes a car when its Remove button is clicked", async () => {
    const cartIds = new Set<string>([bevFixture.id, phevFixture.id]);
    server.use(
      http.get("*/api/cart", () =>
        HttpResponse.json({ carIds: [...cartIds] }),
      ),
      http.delete("*/api/cart/:carId", ({ params }) => {
        cartIds.delete(String(params.carId));
        return HttpResponse.json({ carIds: [...cartIds] });
      }),
    );

    const { user } = renderWithProviders(<Cart />);

    expect(await screen.findByText("Ioniq 5")).toBeInTheDocument();
    expect(await screen.findByText("RAV4 Prime")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Remove Ioniq 5 from shortlist/ }),
    );

    // The removed car disappears; the other remains; the count drops to one.
    await waitFor(() =>
      expect(screen.queryByText("Ioniq 5")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("RAV4 Prime")).toBeInTheDocument();
    expect(screen.getByTestId("cart-count")).toHaveTextContent("1 car");
  });

  it("shows an empty state when the shortlist has no cars", async () => {
    // Baseline handler already returns { carIds: [] }.
    renderWithProviders(<Cart />);

    expect(
      await screen.findByText(/Your shortlist is empty/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Browse the catalog/i }),
    ).toHaveAttribute("href", "/");
  });
});
