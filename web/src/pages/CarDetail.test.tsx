import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import type { Trim, Vehicle } from "@voltlist/shared";
import CarDetail from "./CarDetail";
import { renderWithProviders } from "../test/utils";
import { server } from "../test/msw/server";
import { bevFixture, hevFixture } from "../test/fixtures";

const trimList: Trim[] = [
  {
    name: "SE",
    msrpUsd: 42000,
    drivetrain: "RWD",
    electricRangeMi: 245,
    batteryKwhUsable: 84,
    horsepower: 225,
    zeroToSixtySec: 6.5,
    dcFastMaxKw: 235,
    seatingCapacity: 5,
    notableFeatures: "heat pump, 19in wheels",
  },
  {
    name: "SEL AWD",
    msrpUsd: 47000,
    drivetrain: "AWD",
    electricRangeMi: 290,
    batteryKwhUsable: 84,
    horsepower: 320,
    zeroToSixtySec: 4.9,
    dcFastMaxKw: 257,
    seatingCapacity: 5,
    notableFeatures: "20in wheels, HDA II",
  },
  {
    name: "Limited",
    msrpUsd: 52000,
    drivetrain: "AWD",
    electricRangeMi: 269,
    batteryKwhUsable: 84,
    horsepower: 320,
    zeroToSixtySec: 4.9,
    dcFastMaxKw: 257,
    seatingCapacity: 5,
    notableFeatures: "glass roof, Bose audio",
  },
];

const trimmedCar: Vehicle = {
  ...bevFixture,
  id: "test-trimmed-ioniq-5",
  trims: trimList,
};

/** Serve `trimmedCar` from the detail endpoint for this test. */
function serveTrimmedCar() {
  server.use(
    http.get("*/api/cars/:id", ({ params }) =>
      params.id === trimmedCar.id
        ? HttpResponse.json(trimmedCar)
        : HttpResponse.json({ error: "Not found" }, { status: 404 }),
    ),
  );
}

/** Mount CarDetail behind a matching `/car/:id` route so useParams resolves. */
function renderDetail(id: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/car/:id" element={<CarDetail />} />
    </Routes>,
    { route: `/car/${id}` },
  );
}

describe("CarDetail", () => {
  it("renders the ADAS rows and sources for a mocked car", async () => {
    renderDetail(bevFixture.id);
    await screen.findByRole("heading", { level: 1, name: "Ioniq 5" });

    // ADAS rows are labeled explicitly (adaptive cruise + lane assist required).
    expect(screen.getByText("Adaptive cruise control")).toBeInTheDocument();
    expect(screen.getByText("Lane keep assist")).toBeInTheDocument();
    expect(screen.getByText("Hands-free highway")).toBeInTheDocument();
    // The named ADAS system + a "not available" value both surface.
    expect(screen.getByText("Highway Driving Assist")).toBeInTheDocument();
    expect(screen.getByText("Not available")).toBeInTheDocument();

    // Provenance: each source links out to its url with an as-of date.
    const source = screen.getByRole("link", { name: /fueleconomy\.gov/i });
    expect(source).toHaveAttribute("href", "https://www.fueleconomy.gov");
    expect(screen.getByText(/as of 2026-01-15/)).toBeInTheDocument();
  });

  it("shows grouped spec values and manufacturer deep-links", async () => {
    renderDetail(bevFixture.id);
    await screen.findByRole("heading", { level: 1, name: "Ioniq 5" });

    // Grouped readouts render mono spec values.
    expect(screen.getByText("84 kWh")).toBeInTheDocument(); // usable battery
    expect(screen.getByText("257 kW")).toBeInTheDocument(); // DC fast max

    // Deep-link buttons point at the real maker pages.
    expect(
      screen.getByRole("link", { name: /build & price/i }),
    ).toHaveAttribute("href", bevFixture.buildAndPriceUrl!);
    expect(
      screen.getByRole("link", { name: /manufacturer/i }),
    ).toHaveAttribute("href", bevFixture.manufacturerUrl!);

    // Favorite + shortlist actions are present.
    expect(
      screen.getByRole("button", { name: "Save Ioniq 5 to favorites" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add to shortlist — Ioniq 5" }),
    ).toBeInTheDocument();
  });

  it("renders nullable specs as an em dash for an HEV", async () => {
    renderDetail(hevFixture.id);
    await screen.findByRole("heading", { level: 1, name: "Camry Hybrid" });
    // HEV has no charge port / DC fast charging → em-dashed values appear.
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders a not-found state for an unknown car", async () => {
    renderDetail("does-not-exist");
    expect(await screen.findByText(/couldn't find that vehicle/i)).toBeInTheDocument();
  });

  it("renders a trim selector chip for every trim, defaulting to the base trim", async () => {
    serveTrimmedCar();
    renderDetail(trimmedCar.id);
    await screen.findByRole("heading", { level: 1, name: "Ioniq 5" });

    const group = screen.getByRole("group", { name: /select trim/i });
    // One selectable chip per trim.
    expect(within(group).getByRole("button", { name: "SE" })).toBeInTheDocument();
    expect(
      within(group).getByRole("button", { name: "SEL AWD" }),
    ).toBeInTheDocument();
    expect(
      within(group).getByRole("button", { name: "Limited" }),
    ).toBeInTheDocument();

    // Default selection is the base (first) trim → SE is pressed, its figures show.
    expect(within(group).getByRole("button", { name: "SE" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("hero-price")).toHaveTextContent("$42,000");
    expect(screen.getByText("245 mi electric")).toBeInTheDocument();
  });

  it("updates the hero price and range when another trim is selected", async () => {
    serveTrimmedCar();
    const { user } = renderDetail(trimmedCar.id);
    await screen.findByRole("heading", { level: 1, name: "Ioniq 5" });

    // Base trim figures before selecting.
    expect(screen.getByTestId("hero-price")).toHaveTextContent("$42,000");

    await user.click(screen.getByRole("button", { name: "SEL AWD" }));

    // Hero readout now reflects the chosen trim.
    expect(screen.getByTestId("hero-price")).toHaveTextContent("$47,000");
    expect(screen.getByText("290 mi electric")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "SEL AWD" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("falls back to model-level figures for null trim fields", async () => {
    // A trim that omits price/range/drivetrain should inherit the model's.
    const sparseCar: Vehicle = {
      ...bevFixture,
      id: "test-sparse-trim",
      trims: [
        {
          name: "Standard",
          msrpUsd: null,
          drivetrain: null,
          electricRangeMi: null,
          batteryKwhUsable: null,
          horsepower: null,
          zeroToSixtySec: null,
          dcFastMaxKw: null,
          seatingCapacity: null,
          notableFeatures: null,
        },
      ],
    };
    server.use(
      http.get("*/api/cars/:id", ({ params }) =>
        params.id === sparseCar.id
          ? HttpResponse.json(sparseCar)
          : HttpResponse.json({ error: "Not found" }, { status: 404 }),
      ),
    );
    renderDetail(sparseCar.id);
    await screen.findByRole("heading", { level: 1, name: "Ioniq 5" });

    // Model base price $46,550 and model range 303 mi fill the null trim fields.
    expect(screen.getByTestId("hero-price")).toHaveTextContent("$46,550");
    expect(screen.getByText("303 mi electric")).toBeInTheDocument();
  });

  it("renders the hero with no selector or table for a car with 0 trims", async () => {
    // bevFixture ships `trims: []`.
    renderDetail(bevFixture.id);
    await screen.findByRole("heading", { level: 1, name: "Ioniq 5" });

    expect(screen.queryByRole("group", { name: /select trim/i })).toBeNull();
    expect(screen.queryByTestId("trim-table")).toBeNull();
    // The model-level hero still renders its base price.
    expect(screen.getByTestId("hero-price")).toHaveTextContent("$46,550");
  });
});
