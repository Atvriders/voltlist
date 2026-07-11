import { describe, expect, it } from "vitest";
import {
  DASH,
  formatCuFt,
  formatKw,
  formatKwh,
  formatMiPerKwh,
  formatMiles,
  formatMoney,
  formatMpge,
  formatNumber,
  formatPowertrain,
  formatSeconds,
  formatWeight,
} from "./format";

describe("format", () => {
  it("formats money as whole USD with separators", () => {
    expect(formatMoney(46550)).toBe("$46,550");
    expect(formatMoney(120000)).toBe("$120,000");
    expect(formatMoney(29200)).toBe("$29,200");
    expect(formatMoney(999)).toBe("$999");
  });

  it("formats miles", () => {
    expect(formatMiles(303)).toBe("303 mi");
    expect(formatMiles(1200)).toBe("1,200 mi");
  });

  it("formats energy and power", () => {
    expect(formatKwh(77)).toBe("77 kWh");
    expect(formatKwh(18.1)).toBe("18.1 kWh");
    expect(formatKw(250)).toBe("250 kW");
  });

  it("formats efficiency, mpge, seconds, weight, volume", () => {
    expect(formatMpge(114)).toBe("114 MPGe");
    expect(formatMiPerKwh(3.3)).toBe("3.3 mi/kWh");
    expect(formatSeconds(4.5)).toBe("4.5 s");
    expect(formatWeight(4662)).toBe("4,662 lb");
    expect(formatCuFt(27.2)).toBe("27.2 cu ft");
  });

  it("renders null / undefined / NaN as an em dash", () => {
    expect(DASH).toBe("—");
    expect(formatMoney(null)).toBe("—");
    expect(formatMiles(undefined)).toBe("—");
    expect(formatKwh(null)).toBe("—");
    expect(formatNumber(Number.NaN)).toBe("—");
  });

  it("maps powertrain to a human label", () => {
    expect(formatPowertrain("BEV")).toBe("Electric");
    expect(formatPowertrain("PHEV")).toBe("Plug-in Hybrid");
    expect(formatPowertrain("HEV")).toBe("Hybrid");
  });
});
