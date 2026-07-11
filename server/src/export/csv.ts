import type { Vehicle } from "@voltlist/shared";

type Column = { header: string; value: (v: Vehicle) => unknown };

// One flat column per headline spec field; ADAS is flattened to its key rows.
const COLUMNS: Column[] = [
  { header: "id", value: (v) => v.id },
  { header: "make", value: (v) => v.make },
  { header: "model", value: (v) => v.model },
  { header: "year", value: (v) => v.year },
  { header: "trimsSummary", value: (v) => v.trimsSummary },
  { header: "bodyStyle", value: (v) => v.bodyStyle },
  { header: "powertrainType", value: (v) => v.powertrainType },
  { header: "segment", value: (v) => v.segment },
  { header: "electricRangeMi", value: (v) => v.electricRangeMi },
  { header: "totalRangeMi", value: (v) => v.totalRangeMi },
  { header: "mpge", value: (v) => v.mpge },
  { header: "mpgCombined", value: (v) => v.mpgCombined },
  { header: "efficiencyMiPerKwh", value: (v) => v.efficiencyMiPerKwh },
  { header: "batteryKwhUsable", value: (v) => v.batteryKwhUsable },
  { header: "batteryKwhTotal", value: (v) => v.batteryKwhTotal },
  { header: "fuelTankGal", value: (v) => v.fuelTankGal },
  { header: "dcFastMaxKw", value: (v) => v.dcFastMaxKw },
  { header: "dcFast10to80Min", value: (v) => v.dcFast10to80Min },
  { header: "acOnboardKw", value: (v) => v.acOnboardKw },
  { header: "chargePort", value: (v) => v.chargePort },
  { header: "drivetrain", value: (v) => v.drivetrain },
  { header: "motorLayout", value: (v) => v.motorLayout },
  { header: "horsepower", value: (v) => v.horsepower },
  { header: "torqueLbFt", value: (v) => v.torqueLbFt },
  { header: "zeroToSixtySec", value: (v) => v.zeroToSixtySec },
  { header: "topSpeedMph", value: (v) => v.topSpeedMph },
  { header: "towingCapacityLb", value: (v) => v.towingCapacityLb },
  { header: "adasSystemName", value: (v) => v.adas.systemName },
  { header: "adaptiveCruiseControl", value: (v) => v.adas.adaptiveCruiseControl },
  { header: "laneKeepAssist", value: (v) => v.adas.laneKeepAssist },
  { header: "handsFreeHighway", value: (v) => v.adas.handsFreeHighway },
  { header: "autonomyLevel", value: (v) => v.adas.autonomyLevel },
  { header: "lengthIn", value: (v) => v.lengthIn },
  { header: "widthIn", value: (v) => v.widthIn },
  { header: "heightIn", value: (v) => v.heightIn },
  { header: "wheelbaseIn", value: (v) => v.wheelbaseIn },
  { header: "groundClearanceIn", value: (v) => v.groundClearanceIn },
  { header: "cargoCuFt", value: (v) => v.cargoCuFt },
  { header: "frunkCuFt", value: (v) => v.frunkCuFt },
  { header: "seatingCapacity", value: (v) => v.seatingCapacity },
  { header: "curbWeightLb", value: (v) => v.curbWeightLb },
  { header: "msrpBaseUsd", value: (v) => v.msrpBaseUsd },
  { header: "msrpTopUsd", value: (v) => v.msrpTopUsd },
  { header: "federalTaxCreditEligible", value: (v) => v.federalTaxCreditEligible },
  { header: "warrantyBasic", value: (v) => v.warrantyBasic },
  { header: "warrantyPowertrain", value: (v) => v.warrantyPowertrain },
  { header: "warrantyBattery", value: (v) => v.warrantyBattery },
  { header: "buildAndPriceUrl", value: (v) => v.buildAndPriceUrl },
  { header: "manufacturerUrl", value: (v) => v.manufacturerUrl },
  { header: "dataAsOf", value: (v) => v.dataAsOf },
];

function escapeCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV: one header row of spec fields, one row per cart vehicle. */
export function cartToCsv(vehicles: Vehicle[]): string {
  const rows: string[] = [];
  rows.push(COLUMNS.map((c) => escapeCell(c.header)).join(","));
  for (const v of vehicles) {
    rows.push(COLUMNS.map((c) => escapeCell(c.value(v))).join(","));
  }
  return rows.join("\r\n") + "\r\n";
}
