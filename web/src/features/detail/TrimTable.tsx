import type { ReactNode } from "react";
import type { Trim, Vehicle } from "@voltlist/shared";
import { cx } from "../../lib/cx";
import { Table, THead, TBody, Tr, Th, Td } from "../../design/components";
import {
  DASH,
  formatHp,
  formatKw,
  formatKwh,
  formatMiles,
  formatMoney,
  formatSeats,
  formatSeconds,
} from "../../lib/format";

/** Higher-is-better (`max`) or lower-is-better (`min`) for best-in-column. */
type BestDirection = "max" | "min";

interface TrimColumn {
  key: string;
  label: string;
  /** Formatted display string for a trim's cell. */
  render: (t: Trim) => string;
  /** Render as a mono, tabular-nums instrument readout. */
  numeric?: boolean;
  /** Numeric value used to compute the best-in-column cell (null = no data). */
  metric?: (t: Trim) => number | null;
  best?: BestDirection;
  /** Extra classes (e.g. wider, wrapping) for the header + body cells. */
  className?: string;
}

/**
 * Column order matches the detail datasheet:
 * Trim (row header) / Price / Drivetrain / Range / Battery / HP / 0-60 /
 * Fast-charge / Seats / Notable.
 */
const COLUMNS: TrimColumn[] = [
  {
    key: "price",
    label: "Price",
    render: (t) => formatMoney(t.msrpUsd),
    numeric: true,
    metric: (t) => t.msrpUsd,
    best: "min",
  },
  {
    key: "drivetrain",
    label: "Drivetrain",
    render: (t) => t.drivetrain ?? DASH,
  },
  {
    key: "range",
    label: "Range",
    render: (t) => formatMiles(t.electricRangeMi),
    numeric: true,
    metric: (t) => t.electricRangeMi,
    best: "max",
  },
  {
    key: "battery",
    label: "Battery",
    render: (t) => formatKwh(t.batteryKwhUsable),
    numeric: true,
  },
  {
    key: "hp",
    label: "HP",
    render: (t) => formatHp(t.horsepower),
    numeric: true,
    metric: (t) => t.horsepower,
    best: "max",
  },
  {
    key: "zeroToSixty",
    label: "0–60",
    render: (t) => formatSeconds(t.zeroToSixtySec),
    numeric: true,
    metric: (t) => t.zeroToSixtySec,
    best: "min",
  },
  {
    key: "fastCharge",
    label: "Fast-charge",
    render: (t) => formatKw(t.dcFastMaxKw),
    numeric: true,
  },
  {
    key: "seats",
    label: "Seats",
    render: (t) => formatSeats(t.seatingCapacity),
    numeric: true,
  },
  {
    key: "notable",
    label: "Notable",
    render: (t) => t.notableFeatures ?? DASH,
    className: "min-w-[220px] whitespace-normal text-ink-soft",
  },
];

/**
 * Index of the best-in-column cell, or null when fewer than two trims report a
 * value or they all tie (so a lone data point is never crowned "best").
 */
function bestIndex(
  trims: Trim[],
  metric: (t: Trim) => number | null,
  dir: BestDirection,
): number | null {
  const values = trims.map(metric);
  const present = values.filter((v): v is number => v != null);
  if (present.length < 2) return null;
  const target = dir === "max" ? Math.max(...present) : Math.min(...present);
  if (present.every((v) => v === target)) return null; // all equal → no winner
  return values.findIndex((v) => v != null && v === target);
}

export interface TrimTableProps {
  trims: Trim[];
  powertrain: Vehicle["powertrainType"];
  /** Row of the trim currently shown in the hero — subtly emphasized. */
  selectedIndex?: number;
  className?: string;
}

/**
 * A datasheet-styled comparison of a model's trims: one row per trim, mono
 * spec columns, best-in-column cells subtly tinted `--good`. Scrolls
 * horizontally inside its own overflow container on narrow screens.
 */
export function TrimTable({
  trims,
  selectedIndex,
  className,
}: TrimTableProps) {
  if (trims.length === 0) return null;

  const bestByCol = new Map<string, number | null>();
  for (const col of COLUMNS) {
    if (col.metric && col.best) {
      bestByCol.set(col.key, bestIndex(trims, col.metric, col.best));
    }
  }

  return (
    <section
      className={cx(
        "overflow-hidden rounded-card border border-line bg-surface shadow-card",
        className,
      )}
      aria-label="Trim levels"
      data-testid="trim-table"
    >
      <div className="flex items-baseline justify-between gap-3 px-5 pt-5">
        <h2 className="eyebrow text-ink-soft">Trim levels</h2>
        <span className="font-mono text-13 tabular-nums text-ink-soft">
          {trims.length} {trims.length === 1 ? "trim" : "trims"}
        </span>
      </div>

      <Table className="mt-3 min-w-max">
        <THead>
          <Tr>
            <Th scope="col" className="sticky left-0 z-10 bg-surface text-ink-soft">
              Trim
            </Th>
            {COLUMNS.map((col) => (
              <Th
                key={col.key}
                scope="col"
                className={cx("whitespace-nowrap text-ink-soft", col.className)}
              >
                {col.label}
              </Th>
            ))}
          </Tr>
        </THead>
        <TBody>
          {trims.map((trim, i) => {
            const selected = selectedIndex === i;
            const stickyBg = selected ? "bg-surface-2" : "bg-surface";
            return (
              <Tr
                key={`${trim.name}-${i}`}
                data-testid="trim-row"
                data-selected={selected || undefined}
                aria-current={selected ? "true" : undefined}
                className={selected ? "bg-surface-2" : undefined}
              >
                <Th
                  scope="row"
                  className={cx(
                    "sticky left-0 z-10 whitespace-nowrap align-middle font-body text-sm font-semibold normal-case text-ink",
                    stickyBg,
                  )}
                >
                  {trim.name}
                </Th>
                {COLUMNS.map((col) => {
                  const isBest = bestByCol.get(col.key) === i;
                  const value: ReactNode = col.render(trim);
                  return (
                    <Td
                      key={col.key}
                      className={cx(
                        "align-middle",
                        col.numeric && "font-mono text-sm tabular-nums",
                        col.className,
                        isBest &&
                          "bg-[color-mix(in_srgb,var(--good)_10%,transparent)]",
                      )}
                    >
                      {isBest ? (
                        <span className="font-medium text-good">
                          {value}
                          <span className="sr-only"> (best)</span>
                        </span>
                      ) : (
                        value
                      )}
                    </Td>
                  );
                })}
              </Tr>
            );
          })}
        </TBody>
      </Table>
    </section>
  );
}
