import { z } from "zod";

export const Availability = z.enum(["Standard", "Optional", "NotAvailable"]);
export const Powertrain = z.enum(["BEV", "PHEV", "HEV"]);
export const Drivetrain = z.enum(["FWD", "RWD", "AWD"]);
export const BodyStyle = z.enum(["SUV","Sedan","Truck","Hatchback","Minivan","Coupe","Wagon","Crossover","Van"]);
export const ChargePort = z.enum(["NACS","CCS","J1772","CHAdeMO"]);

// Only http/https URLs — reject javascript:/data: and other schemes that would
// be a stored-XSS vector when rendered as links.
const httpUrl = z.string().url().refine((u) => /^https?:\/\//i.test(u), "must be an http(s) URL");

export const Adas = z.object({
  systemName: z.string().nullable(),
  adaptiveCruiseControl: Availability,
  laneKeepAssist: Availability,
  laneCentering: Availability,
  handsFreeHighway: Availability,
  automaticEmergencyBraking: Availability,
  blindSpotMonitoring: Availability,
  selfParking: Availability,
  autonomyLevel: z.string(),           // "SAE L2", "SAE L2+", ...
});

export const Source = z.object({
  field: z.string().optional(),
  url: httpUrl,
  asOf: z.string(),                    // ISO date
});

export const Trim = z.object({
  name: z.string(),                       // "SE", "SEL AWD", "Limited", "Performance", "Type S"...
  msrpUsd: z.number().nullable(),         // base MSRP for this trim (excl. destination)
  drivetrain: Drivetrain.nullable(),      // may differ from the model default
  electricRangeMi: z.number().nullable(), // EPA all-electric range for this trim
  batteryKwhUsable: z.number().nullable(),
  horsepower: z.number().nullable(),
  zeroToSixtySec: z.number().nullable(),
  dcFastMaxKw: z.number().nullable(),
  seatingCapacity: z.number().nullable(),
  notableFeatures: z.string().nullable(), // brief, e.g. "heat pump, 20in wheels, HDA II, glass roof"
});
export type Trim = z.infer<typeof Trim>;

export const Vehicle = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), // slug
  make: z.string(), model: z.string(),
  year: z.number().int().min(2024).max(2026),
  trimsSummary: z.string(),
  bodyStyle: BodyStyle, powertrainType: Powertrain, segment: z.string(),
  electricRangeMi: z.number().nullable(),
  totalRangeMi: z.number().nullable(),
  mpge: z.number().nullable(), mpgCombined: z.number().nullable(),
  efficiencyMiPerKwh: z.number().nullable(),
  batteryKwhUsable: z.number().nullable(), batteryKwhTotal: z.number().nullable(),
  fuelTankGal: z.number().nullable(),
  dcFastMaxKw: z.number().nullable(), dcFast10to80Min: z.number().nullable(),
  acOnboardKw: z.number().nullable(), chargePort: ChargePort.nullable(),
  drivetrain: Drivetrain, motorLayout: z.string().nullable(),
  horsepower: z.number().nullable(), torqueLbFt: z.number().nullable(),
  zeroToSixtySec: z.number().nullable(), topSpeedMph: z.number().nullable(),
  towingCapacityLb: z.number().nullable(),
  adas: Adas,
  lengthIn: z.number().nullable(), widthIn: z.number().nullable(),
  heightIn: z.number().nullable(), wheelbaseIn: z.number().nullable(),
  groundClearanceIn: z.number().nullable(),
  cargoCuFt: z.number().nullable(), frunkCuFt: z.number().nullable(),
  seatingCapacity: z.number().nullable(), curbWeightLb: z.number().nullable(),
  msrpBaseUsd: z.number().nullable(), msrpTopUsd: z.number().nullable(),
  federalTaxCreditEligible: z.boolean().nullable(),
  federalTaxCreditNote: z.string().nullable(),
  warrantyBasic: z.string().nullable(), warrantyPowertrain: z.string().nullable(),
  warrantyBattery: z.string().nullable(),
  buildAndPriceUrl: httpUrl.nullable(),
  manufacturerUrl: httpUrl.nullable(),
  sources: z.array(Source).min(1),
  dataAsOf: z.string(),
  trims: z.array(Trim).default([]),
}).superRefine((v, ctx) => {
  // powertrain-appropriate presence
  if (v.powertrainType === "BEV") {
    if (v.batteryKwhUsable == null && v.batteryKwhTotal == null)
      ctx.addIssue({ code:"custom", message:"BEV needs battery kWh", path:["batteryKwhUsable"] });
    if (v.electricRangeMi == null)
      ctx.addIssue({ code:"custom", message:"BEV needs electricRangeMi", path:["electricRangeMi"] });
  }
  if (v.powertrainType === "HEV") {
    if (v.fuelTankGal == null)
      ctx.addIssue({ code:"custom", message:"HEV needs fuelTankGal", path:["fuelTankGal"] });
    if (v.mpgCombined == null)
      ctx.addIssue({ code:"custom", message:"HEV needs mpgCombined", path:["mpgCombined"] });
  }
  if (v.powertrainType === "PHEV") {
    if (v.electricRangeMi == null)
      ctx.addIssue({ code:"custom", message:"PHEV needs electricRangeMi", path:["electricRangeMi"] });
    if (v.fuelTankGal == null)
      ctx.addIssue({ code:"custom", message:"PHEV needs fuelTankGal", path:["fuelTankGal"] });
  }
});
export type Vehicle = z.infer<typeof Vehicle>;
export type AvailabilityT = z.infer<typeof Availability>;
