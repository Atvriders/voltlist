import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { Vehicle } from "@voltlist/shared";
import { cx } from "../../lib/cx";
import {
  RangeMeter,
  Badge,
  powertrainTone,
  Table,
  THead,
  TBody,
  Tr,
  Th,
  Td,
} from "../../design/components";
import {
  DASH,
  formatNumber,
  formatMiles,
  formatMoney,
  formatKwh,
  formatKw,
  formatMpge,
  formatMpg,
  formatMiPerKwh,
  formatHp,
  formatTorque,
  formatSeconds,
  formatMph,
  formatInches,
  formatWeight,
  formatCuFt,
  formatGal,
  formatTowing,
  formatSeats,
  formatPowertrain,
} from "../../lib/format";

/** Higher-is-better (`max`) or lower-is-better (`min`) for best-in-row marking. */
type BestDirection = "max" | "min";

interface SpecRow {
  key: string;
  label: string;
  /** Formatted display string for a car's cell. */
  render: (car: Vehicle) => string;
  /** Numeric value used to compute the best-in-row cell (null = no data). */
  metric?: (car: Vehicle) => number | null;
  best?: BestDirection;
}

interface SpecSection {
  title: string;
  rows: SpecRow[];
}

function minutes(v: number | null): string {
  return v == null ? DASH : `${formatNumber(v)} min`;
}

/** Datasheet layout: grouped readout blocks, each a set of labeled rows. */
const SECTIONS: SpecSection[] = [
  {
    title: "Powertrain & Range",
    rows: [
      { key: "powertrain", label: "Powertrain", render: (c) => formatPowertrain(c.powertrainType) },
      { key: "electricRange", label: "Electric range", render: (c) => formatMiles(c.electricRangeMi), metric: (c) => c.electricRangeMi, best: "max" },
      { key: "totalRange", label: "Total range", render: (c) => formatMiles(c.totalRangeMi), metric: (c) => c.totalRangeMi, best: "max" },
      { key: "mpge", label: "MPGe", render: (c) => formatMpge(c.mpge), metric: (c) => c.mpge, best: "max" },
      { key: "mpg", label: "MPG combined", render: (c) => formatMpg(c.mpgCombined), metric: (c) => c.mpgCombined, best: "max" },
      { key: "efficiency", label: "Efficiency", render: (c) => formatMiPerKwh(c.efficiencyMiPerKwh), metric: (c) => c.efficiencyMiPerKwh, best: "max" },
      { key: "battery", label: "Usable battery", render: (c) => formatKwh(c.batteryKwhUsable), metric: (c) => c.batteryKwhUsable, best: "max" },
    ],
  },
  {
    title: "Charging",
    rows: [
      { key: "dcFast", label: "DC fast (max)", render: (c) => formatKw(c.dcFastMaxKw), metric: (c) => c.dcFastMaxKw, best: "max" },
      { key: "dcFast1080", label: "DC fast 10–80%", render: (c) => minutes(c.dcFast10to80Min), metric: (c) => c.dcFast10to80Min, best: "min" },
      { key: "acOnboard", label: "AC onboard", render: (c) => formatKw(c.acOnboardKw), metric: (c) => c.acOnboardKw, best: "max" },
      { key: "chargePort", label: "Charge port", render: (c) => c.chargePort ?? DASH },
      { key: "fuelTank", label: "Fuel tank", render: (c) => formatGal(c.fuelTankGal) },
    ],
  },
  {
    title: "Drivetrain & Performance",
    rows: [
      { key: "drivetrain", label: "Drivetrain", render: (c) => c.drivetrain },
      { key: "horsepower", label: "Horsepower", render: (c) => formatHp(c.horsepower), metric: (c) => c.horsepower, best: "max" },
      { key: "torque", label: "Torque", render: (c) => formatTorque(c.torqueLbFt), metric: (c) => c.torqueLbFt, best: "max" },
      { key: "zeroToSixty", label: "0–60 mph", render: (c) => formatSeconds(c.zeroToSixtySec), metric: (c) => c.zeroToSixtySec, best: "min" },
      { key: "topSpeed", label: "Top speed", render: (c) => formatMph(c.topSpeedMph), metric: (c) => c.topSpeedMph, best: "max" },
      { key: "towing", label: "Towing", render: (c) => formatTowing(c.towingCapacityLb), metric: (c) => c.towingCapacityLb, best: "max" },
    ],
  },
  {
    title: "Dimensions",
    rows: [
      { key: "seating", label: "Seating", render: (c) => formatSeats(c.seatingCapacity), metric: (c) => c.seatingCapacity, best: "max" },
      { key: "cargo", label: "Cargo", render: (c) => formatCuFt(c.cargoCuFt), metric: (c) => c.cargoCuFt, best: "max" },
      { key: "frunk", label: "Frunk", render: (c) => formatCuFt(c.frunkCuFt), metric: (c) => c.frunkCuFt, best: "max" },
      { key: "length", label: "Length", render: (c) => formatInches(c.lengthIn) },
      { key: "curbWeight", label: "Curb weight", render: (c) => formatWeight(c.curbWeightLb) },
    ],
  },
  {
    title: "Ownership",
    rows: [
      { key: "basePrice", label: "Base price", render: (c) => formatMoney(c.msrpBaseUsd), metric: (c) => c.msrpBaseUsd, best: "min" },
      { key: "topPrice", label: "As-tested top", render: (c) => formatMoney(c.msrpTopUsd) },
      {
        key: "taxCredit",
        label: "Federal tax credit",
        render: (c) =>
          c.federalTaxCreditEligible === true
            ? "Eligible"
            : c.federalTaxCreditEligible === false
              ? "Not eligible"
              : DASH,
      },
      { key: "warranty", label: "Basic warranty", render: (c) => c.warrantyBasic ?? DASH },
      { key: "batteryWarranty", label: "Battery warranty", render: (c) => c.warrantyBattery ?? DASH },
    ],
  },
];

/**
 * Indices of the best-in-row cells. Only marks when at least two cars have a
 * value AND they are not all equal (so a lone data point is never "best").
 */
function bestIndices(cars: Vehicle[], row: SpecRow): Set<number> {
  const marked = new Set<number>();
  if (!row.metric || !row.best) return marked;
  const values = cars.map(row.metric);
  const present = values.filter((v): v is number => v != null);
  if (present.length < 2) return marked;
  const target = row.best === "max" ? Math.max(...present) : Math.min(...present);
  if (present.every((v) => v === target)) return marked; // all equal → no winner
  values.forEach((v, i) => {
    if (v != null && v === target) marked.add(i);
  });
  return marked;
}

export interface CompareTableProps {
  cars: Vehicle[];
  className?: string;
}

/**
 * The compare matrix: cars as columns, specs as rows, RangeMeters aligned in
 * the header, and best-in-row cells marked with a `--good` caret + underline.
 */
export function CompareTable({ cars, className }: CompareTableProps) {
  return (
    <div
      className={cx(
        "overflow-hidden rounded-card border border-line bg-surface shadow-card",
        className,
      )}
    >
      <Table className="min-w-max">
        <THead>
          <Tr className="align-bottom">
            <Th
              scope="col"
              className="sticky left-0 z-10 bg-surface align-bottom text-ink-soft"
            >
              Spec
            </Th>
            {cars.map((car) => (
              <Th
                key={car.id}
                scope="col"
                className="min-w-[190px] border-l border-line align-bottom"
              >
                <div className="flex flex-col items-start gap-1.5 normal-case font-body text-ink">
                  <span className="eyebrow text-ink-soft">{car.make}</span>
                  <Link
                    to={`/car/${car.id}`}
                    className="font-display text-base font-semibold normal-case text-ink hover:text-voltage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
                  >
                    {car.model}
                  </Link>
                  <span className="font-mono text-13 tabular-nums normal-case text-ink-soft">
                    {car.year} · {car.segment}
                  </span>
                  <Badge tone={powertrainTone(car.powertrainType)}>
                    {formatPowertrain(car.powertrainType)}
                  </Badge>
                  <div className="mt-1 w-full">
                    <RangeMeter
                      powertrain={car.powertrainType}
                      electricRangeMi={car.electricRangeMi}
                      totalRangeMi={car.totalRangeMi}
                      size="md"
                    />
                  </div>
                </div>
              </Th>
            ))}
          </Tr>
        </THead>
        <TBody>
          {SECTIONS.map((section) => (
            <Fragment key={section.title}>
              <Tr className="border-t-2 border-line">
                <Td
                  colSpan={cars.length + 1}
                  className="eyebrow sticky left-0 bg-surface-2 py-1.5 text-ink-soft"
                >
                  {section.title}
                </Td>
              </Tr>
              {section.rows.map((row) => {
                const marked = bestIndices(cars, row);
                return (
                  <Tr key={row.key} data-testid={`compare-row-${row.key}`}>
                    <Th
                      scope="row"
                      className="sticky left-0 z-10 whitespace-nowrap bg-surface align-middle font-medium text-ink-soft"
                    >
                      {row.label}
                    </Th>
                    {cars.map((car, i) => {
                      const isBest = marked.has(i);
                      return (
                        <Td
                          key={car.id}
                          className={cx(
                            "border-l border-line font-mono text-sm tabular-nums align-middle",
                            isBest ? "text-good" : "text-ink",
                          )}
                        >
                          {isBest ? (
                            <span className="inline-flex items-center gap-1 font-medium underline decoration-good/50 decoration-2 underline-offset-4">
                              <span>{row.render(car)}</span>
                              <span aria-hidden="true" className="text-good">
                                ▲
                              </span>
                              <span className="sr-only">best in row</span>
                            </span>
                          ) : (
                            row.render(car)
                          )}
                        </Td>
                      );
                    })}
                  </Tr>
                );
              })}
            </Fragment>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
