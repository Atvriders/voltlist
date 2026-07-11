import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { CompareTable } from "./CompareTable";
import { renderWithProviders } from "../../test/utils";
import { bevFixture, phevFixture } from "../../test/fixtures";

describe("CompareTable", () => {
  it("renders one column per car plus the spec label column", () => {
    renderWithProviders(<CompareTable cars={[bevFixture, phevFixture]} />);
    expect(screen.getByRole("link", { name: "Ioniq 5" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RAV4 Prime" })).toBeInTheDocument();
    // "Spec" label column + two car columns.
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  });

  it("marks the best (max) electric-range cell", () => {
    renderWithProviders(<CompareTable cars={[bevFixture, phevFixture]} />);
    const row = screen.getByTestId("compare-row-electricRange");
    const cells = within(row).getAllByRole("cell");
    expect(cells).toHaveLength(2);
    // BEV 303 mi beats PHEV 42 mi.
    expect(cells[0]).toHaveTextContent("303 mi");
    expect(cells[0]).toHaveTextContent(/best in row/i);
    expect(cells[1]).toHaveTextContent("42 mi");
    expect(cells[1]).not.toHaveTextContent(/best in row/i);
  });

  it("marks the best (min) base-price cell", () => {
    renderWithProviders(<CompareTable cars={[bevFixture, phevFixture]} />);
    const row = screen.getByTestId("compare-row-basePrice");
    const cells = within(row).getAllByRole("cell");
    // PHEV $44,265 undercuts BEV $46,550 — lower price wins.
    expect(cells[1]).toHaveTextContent("$44,265");
    expect(cells[1]).toHaveTextContent(/best in row/i);
    expect(cells[0]).not.toHaveTextContent(/best in row/i);
  });

  it("does not mark a lone data point as best-in-row", () => {
    // Only the BEV reports MPGe; the other car's is null, so nothing wins.
    const noMpge = { ...phevFixture, id: "test-null-mpge", mpge: null };
    renderWithProviders(<CompareTable cars={[bevFixture, noMpge]} />);
    const row = screen.getByTestId("compare-row-mpge");
    const cells = within(row).getAllByRole("cell");
    expect(cells[0]).not.toHaveTextContent(/best in row/i);
    expect(cells[1]).not.toHaveTextContent(/best in row/i);
  });
});
