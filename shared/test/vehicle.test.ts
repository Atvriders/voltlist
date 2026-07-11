import { describe, it, expect } from "vitest";
import { Vehicle } from "../src/vehicle";

const adas = {
  systemName: "Autopilot",
  adaptiveCruiseControl: "Standard",
  laneKeepAssist: "Standard",
  laneCentering: "Standard",
  handsFreeHighway: "NotAvailable",
  automaticEmergencyBraking: "Standard",
  blindSpotMonitoring: "Standard",
  selfParking: "Optional",
  autonomyLevel: "SAE L2",
};

const sources = [{ url: "https://www.example.com/spec", asOf: "2026-01-15" }];

// Every schema key present (nullable keys default to null); powertrain-specific
// fields are set in each valid vehicle below.
const base = {
  trimsSummary: "Base through top trim",
  electricRangeMi: null,
  totalRangeMi: null,
  mpge: null,
  mpgCombined: null,
  efficiencyMiPerKwh: null,
  batteryKwhUsable: null,
  batteryKwhTotal: null,
  fuelTankGal: null,
  dcFastMaxKw: null,
  dcFast10to80Min: null,
  acOnboardKw: null,
  chargePort: null,
  motorLayout: null,
  horsepower: null,
  torqueLbFt: null,
  zeroToSixtySec: null,
  topSpeedMph: null,
  towingCapacityLb: null,
  adas,
  lengthIn: null,
  widthIn: null,
  heightIn: null,
  wheelbaseIn: null,
  groundClearanceIn: null,
  cargoCuFt: null,
  frunkCuFt: null,
  seatingCapacity: null,
  curbWeightLb: null,
  msrpBaseUsd: null,
  msrpTopUsd: null,
  federalTaxCreditEligible: null,
  federalTaxCreditNote: null,
  warrantyBasic: null,
  warrantyPowertrain: null,
  warrantyBattery: null,
  buildAndPriceUrl: null,
  manufacturerUrl: null,
  sources,
  dataAsOf: "2026-01-15",
};

const validBev = {
  ...base,
  id: "tesla-model-3-2025",
  make: "Tesla",
  model: "Model 3",
  year: 2025,
  bodyStyle: "Sedan",
  powertrainType: "BEV",
  segment: "Compact luxury sedan",
  electricRangeMi: 363,
  batteryKwhUsable: 75,
  drivetrain: "RWD",
};

const validPhev = {
  ...base,
  id: "toyota-rav4-prime-2025",
  make: "Toyota",
  model: "RAV4 Prime",
  year: 2025,
  bodyStyle: "SUV",
  powertrainType: "PHEV",
  segment: "Compact SUV",
  electricRangeMi: 42,
  fuelTankGal: 14.5,
  drivetrain: "AWD",
};

const validHev = {
  ...base,
  id: "toyota-camry-2025",
  make: "Toyota",
  model: "Camry",
  year: 2025,
  bodyStyle: "Sedan",
  powertrainType: "HEV",
  segment: "Midsize sedan",
  mpgCombined: 51,
  fuelTankGal: 13.2,
  drivetrain: "FWD",
};

describe("Vehicle schema", () => {
  it("parses a valid BEV", () => {
    expect(Vehicle.safeParse(validBev).success).toBe(true);
  });

  it("parses a valid PHEV", () => {
    expect(Vehicle.safeParse(validPhev).success).toBe(true);
  });

  it("parses a valid HEV", () => {
    expect(Vehicle.safeParse(validHev).success).toBe(true);
  });

  it("rejects a BEV missing battery kWh", () => {
    const bevNoBattery = { ...validBev, batteryKwhUsable: null, batteryKwhTotal: null };
    expect(Vehicle.safeParse(bevNoBattery).success).toBe(false);
  });

  it("rejects an HEV missing fuelTankGal", () => {
    const hevNoTank = { ...validHev, fuelTankGal: null };
    expect(Vehicle.safeParse(hevNoTank).success).toBe(false);
  });

  it("parses a vehicle with a valid trims array", () => {
    const withTrims = {
      ...validBev,
      trims: [
        {
          name: "RWD",
          msrpUsd: 42490,
          drivetrain: "RWD",
          electricRangeMi: 363,
          batteryKwhUsable: 75,
          horsepower: 283,
          zeroToSixtySec: 5.8,
          dcFastMaxKw: 250,
          seatingCapacity: 5,
          notableFeatures: "heat pump, 18in wheels, glass roof",
        },
        {
          name: "Performance AWD",
          msrpUsd: 54990,
          drivetrain: "AWD",
          electricRangeMi: 296,
          batteryKwhUsable: 75,
          horsepower: 510,
          zeroToSixtySec: 2.9,
          dcFastMaxKw: 250,
          seatingCapacity: 5,
          notableFeatures: null,
        },
      ],
    };
    const parsed = Vehicle.safeParse(withTrims);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.trims).toHaveLength(2);
  });

  it("defaults trims to [] when the field is omitted", () => {
    const parsed = Vehicle.safeParse(validBev);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.trims).toEqual([]);
  });
});
