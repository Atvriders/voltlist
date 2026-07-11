import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Trim } from "@voltlist/shared";
import { TrimTable } from "./TrimTable";

const trims: Trim[] = [
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

/** Locate the `<tr>` whose row-header cell is exactly `name`. */
function rowFor(name: string): HTMLElement {
  const th = screen.getByText(name);
  const tr = th.closest("tr");
  if (!tr) throw new Error(`no row for trim ${name}`);
  return tr;
}

describe("TrimTable", () => {
  it("renders one row per trim with each trim name", () => {
    render(<TrimTable trims={trims} powertrain="BEV" />);
    expect(screen.getAllByTestId("trim-row")).toHaveLength(3);
    expect(screen.getByText("SE")).toBeInTheDocument();
    expect(screen.getByText("SEL AWD")).toBeInTheDocument();
    expect(screen.getByText("Limited")).toBeInTheDocument();
  });

  it("renders the trim figures in tabular mono cells", () => {
    render(<TrimTable trims={trims} powertrain="BEV" />);
    const se = rowFor("SE");

    // Every documented spec column surfaces for the SE trim…
    expect(within(se).getByText("$42,000")).toBeInTheDocument();
    expect(within(se).getByText("RWD")).toBeInTheDocument();
    expect(within(se).getByText("245 mi")).toBeInTheDocument();
    expect(within(se).getByText("84 kWh")).toBeInTheDocument();
    expect(within(se).getByText("225 hp")).toBeInTheDocument();
    expect(within(se).getByText("6.5 s")).toBeInTheDocument();
    expect(within(se).getByText("235 kW")).toBeInTheDocument();
    expect(within(se).getByText("heat pump, 19in wheels")).toBeInTheDocument();

    // …and numeric cells render in the mono instrument face (tabular-nums).
    const batteryCell = within(se).getByText("84 kWh").closest("td");
    expect(batteryCell).toHaveClass("font-mono");
    expect(batteryCell).toHaveClass("tabular-nums");
  });

  it("marks the best-in-column cells (min price, max range)", () => {
    render(<TrimTable trims={trims} powertrain="BEV" />);

    // Cheapest trim wins the Price column.
    const cheapest = within(rowFor("SE")).getByText("$42,000");
    expect(cheapest).toHaveTextContent(/best/i);
    // A pricier trim is not crowned.
    const dearest = within(rowFor("Limited")).getByText("$52,000");
    expect(dearest).not.toHaveTextContent(/best/i);

    // Longest range wins the Range column (SEL AWD 290 mi > SE 245 > Ltd 269).
    const longestRange = within(rowFor("SEL AWD")).getByText("290 mi");
    expect(longestRange).toHaveTextContent(/best/i);
  });

  it("renders null trim fields as an em dash", () => {
    const sparse: Trim[] = [
      {
        name: "Base",
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
    ];
    render(<TrimTable trims={sparse} powertrain="BEV" />);
    // A lone trim with all-null specs shows dashes and no best-in-column mark.
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders nothing when there are no trims", () => {
    const { container } = render(<TrimTable trims={[]} powertrain="BEV" />);
    expect(container).toBeEmptyDOMElement();
  });
});
