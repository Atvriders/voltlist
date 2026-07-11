import PDFDocument from "pdfkit";
import type { Vehicle } from "@voltlist/shared";

function fmt(value: unknown): string {
  return value == null ? "—" : String(value);
}

interface Spec {
  label: string;
  value: (v: Vehicle) => unknown;
}

const SPECS: Spec[] = [
  { label: "Powertrain", value: (v) => v.powertrainType },
  { label: "Body style", value: (v) => v.bodyStyle },
  { label: "Segment", value: (v) => v.segment },
  { label: "Electric range (mi)", value: (v) => v.electricRangeMi },
  { label: "Total range (mi)", value: (v) => v.totalRangeMi },
  { label: "MPGe", value: (v) => v.mpge },
  { label: "MPG combined", value: (v) => v.mpgCombined },
  { label: "Battery usable (kWh)", value: (v) => v.batteryKwhUsable },
  { label: "Fuel tank (gal)", value: (v) => v.fuelTankGal },
  { label: "DC fast max (kW)", value: (v) => v.dcFastMaxKw },
  { label: "Charge port", value: (v) => v.chargePort },
  { label: "Drivetrain", value: (v) => v.drivetrain },
  { label: "Horsepower", value: (v) => v.horsepower },
  { label: "0-60 (s)", value: (v) => v.zeroToSixtySec },
  { label: "Seating", value: (v) => v.seatingCapacity },
  { label: "ADAS system", value: (v) => v.adas.systemName },
  { label: "Adaptive cruise", value: (v) => v.adas.adaptiveCruiseControl },
  { label: "Lane assist", value: (v) => v.adas.laneKeepAssist },
  { label: "Hands-free highway", value: (v) => v.adas.handsFreeHighway },
  { label: "MSRP base (USD)", value: (v) => v.msrpBaseUsd },
  { label: "Federal tax credit", value: (v) => v.federalTaxCreditEligible },
];

/** Render the cart as a spec sheet PDF, resolving to a Buffer. */
export function cartToPdf(vehicles: Vehicle[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("VoltList — Cart Comparison", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#666").text(`Generated ${new Date().toISOString().slice(0, 10)} • ${vehicles.length} vehicle(s)`);
    doc.fillColor("#000").moveDown(1);

    vehicles.forEach((v, i) => {
      if (i > 0) doc.moveDown(1);
      doc.fontSize(14).text(`${v.year} ${v.make} ${v.model}`);
      doc.fontSize(9).fillColor("#666").text(v.trimsSummary);
      doc.fillColor("#000").moveDown(0.4);
      doc.fontSize(9);
      for (const spec of SPECS) {
        doc.text(`${spec.label}: ${fmt(spec.value(v))}`);
      }
    });

    doc.end();
  });
}
