import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import Catalog from "./Catalog";
import { renderWithProviders } from "../test/utils";
import { server } from "../test/msw/server";

describe("Catalog page", () => {
  it("lists every car and reports the result count", async () => {
    renderWithProviders(<Catalog />);

    await waitFor(() =>
      expect(screen.getAllByTestId("spec-card")).toHaveLength(3),
    );
    expect(screen.getByText(/^3 cars$/)).toBeInTheDocument();
    expect(screen.getByText("Ioniq 5")).toBeInTheDocument();
  });

  it("filters the list when a drivetrain facet is applied", async () => {
    const { user } = renderWithProviders(<Catalog />);
    await waitFor(() =>
      expect(screen.getAllByTestId("spec-card")).toHaveLength(3),
    );

    // Only the HEV fixture is FWD; the two others are AWD.
    await user.click(screen.getByRole("button", { name: "FWD" }));

    await waitFor(() =>
      expect(screen.getAllByTestId("spec-card")).toHaveLength(1),
    );
    expect(screen.getByText("Camry Hybrid")).toBeInTheDocument();
    expect(screen.queryByText("Ioniq 5")).not.toBeInTheDocument();
    expect(screen.getByText(/^1 car$/)).toBeInTheDocument();
    // The facet is reflected in the query the API received.
    expect(screen.getByRole("button", { name: "FWD" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows the empty state when no cars match the filters", async () => {
    const { user } = renderWithProviders(<Catalog />);
    await waitFor(() =>
      expect(screen.getAllByTestId("spec-card")).toHaveLength(3),
    );

    // No fixture is RWD → the filtered list is empty.
    await user.click(screen.getByRole("button", { name: "RWD" }));

    await waitFor(() =>
      expect(
        screen.getByText(/No cars match these filters/i),
      ).toBeInTheDocument(),
    );
    expect(screen.queryAllByTestId("spec-card")).toHaveLength(0);
    expect(screen.getByText(/Loosen a filter to see more/i)).toBeInTheDocument();
  });

  it("keeps focus on Max price after committing Min price on blur", async () => {
    // Uncontrolled price inputs must not be keyed on the live committed query,
    // or committing Min on blur would remount the form and drop focus while
    // tabbing Min → Max.
    const { user } = renderWithProviders(<Catalog />);
    await waitFor(() =>
      expect(screen.getAllByTestId("spec-card")).toHaveLength(3),
    );

    const min = screen.getByLabelText("Minimum price in USD");
    const max = screen.getByLabelText("Maximum price in USD");

    await user.type(min, "30000");
    // Tab moves focus Min → Max; the form's blur handler commits Min to the URL.
    await user.tab();
    expect(max).toHaveFocus();

    // The commit is reflected in the query (fewer cards)...
    await waitFor(() =>
      expect(screen.getAllByTestId("spec-card")).toHaveLength(2),
    );

    // ...and Max is still the same, focused node that accepts typing.
    expect(screen.getByLabelText("Maximum price in USD")).toBe(max);
    expect(max).toHaveFocus();
    await user.type(max, "50000");
    expect(max).toHaveFocus();
    expect(max).toHaveValue(50000);
  });

  it("renders the error state when the catalog request fails", async () => {
    server.use(
      http.get("*/api/cars", () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );
    renderWithProviders(<Catalog />);

    await waitFor(() =>
      expect(
        screen.getByText(/Couldn't load the catalog/i),
      ).toBeInTheDocument(),
    );
  });
});
