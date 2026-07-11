import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { SpecCard } from "./SpecCard";
import { renderWithProviders } from "../../test/utils";
import { bevFixture } from "../../test/fixtures";

describe("SpecCard", () => {
  it("renders wordmark, headline stats, and actions", () => {
    renderWithProviders(<SpecCard car={bevFixture} />);
    expect(screen.getByText("Hyundai")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ioniq 5" }),
    ).toHaveAttribute("href", "/car/test-ioniq-5-2026");
    // Headline stats: range / drivetrain / price.
    expect(screen.getByText("303 mi")).toBeInTheDocument();
    expect(screen.getByText("AWD")).toBeInTheDocument();
    expect(screen.getByText("$46,550")).toBeInTheDocument();
    // Actions.
    expect(
      screen.getByRole("button", { name: "Save Ioniq 5 to favorites" }),
    ).toBeInTheDocument();
    // WCAG 2.5.3: the accessible name starts with the visible button text.
    const shortlist = screen.getByRole("button", {
      name: "Add to shortlist — Ioniq 5",
    });
    expect(shortlist).toBeInTheDocument();
    expect(shortlist).toHaveTextContent("Add to shortlist");
    expect(shortlist.getAttribute("aria-label")).toContain(
      shortlist.textContent ?? "",
    );
  });

  it("renders a null price as an em dash", () => {
    renderWithProviders(
      <SpecCard car={{ ...bevFixture, msrpBaseUsd: null }} />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
