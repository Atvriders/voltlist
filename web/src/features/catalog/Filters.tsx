import type { ReactNode } from "react";
import {
  Powertrain,
  Drivetrain,
  BodyStyle,
  ChargePort,
} from "@voltlist/shared";
import type { CarQuery, Facets } from "@voltlist/shared";
import { Button, Chip, Input, Select } from "../../design/components";
import { formatPowertrain } from "../../lib/format";
import { cx } from "../../lib/cx";

/** Literal unions pulled from the frozen CarQuery contract (never re-declared). */
type PowertrainT = NonNullable<CarQuery["powertrain"]>[number];
type DrivetrainT = NonNullable<CarQuery["drivetrain"]>[number];

const CHARGE_PORTS: string[] = [...ChargePort.options];
const BODY_STYLE_FALLBACK: string[] = [...BodyStyle.options];

const ELECTRIC_RANGE_STEPS = [50, 100, 150, 200, 250, 300] as const;
const SEATING_STEPS = [2, 4, 5, 6, 7] as const;

export interface FiltersProps {
  /** The active query (the URL is the single source of truth in the page). */
  query: CarQuery;
  /** Available makes/body styles from the current result set. */
  facets?: Facets;
  /** How many facets are currently active (drives the reset affordance). */
  activeCount?: number;
  /**
   * Bumped by the page only on reset. Used as the `key` for the uncontrolled
   * search/price inputs so they re-seed on reset WITHOUT remounting (and
   * dropping focus) on every live commit.
   */
  resetKey?: number;
  /** Apply a partial patch to the query (page is reset by the page). */
  onChange: (patch: Partial<CarQuery>) => void;
  /** Clear every facet. */
  onReset: () => void;
  className?: string;
}

/** Add/remove a value from a multi-select facet; empty → undefined so the URL clears. */
function toggleArr<T extends string>(
  arr: readonly T[] | undefined,
  value: T,
): T[] | undefined {
  const set = new Set<T>(arr ?? []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return set.size ? [...set] : undefined;
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <div className="eyebrow mb-2 text-ink-soft">{label}</div>
      {children}
    </section>
  );
}

function ChipRow<T extends string>({
  options,
  selected,
  onToggle,
  renderLabel,
  scroll,
  emptyHint,
}: {
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  renderLabel?: (value: T) => ReactNode;
  scroll?: boolean;
  emptyHint?: string;
}) {
  if (options.length === 0 && emptyHint) {
    return <p className="text-13 text-ink-soft">{emptyHint}</p>;
  }
  return (
    <div
      className={cx(
        "flex flex-wrap gap-1.5",
        scroll && "max-h-48 overflow-y-auto pr-1",
      )}
    >
      {options.map((option) => (
        <Chip
          key={option}
          active={selected.includes(option)}
          onClick={() => onToggle(option)}
        >
          {renderLabel ? renderLabel(option) : option}
        </Chip>
      ))}
    </div>
  );
}

/** A search field that commits `q` on submit (Enter) or blur — uncontrolled so
 * an external reset re-seeds it via `key` (the reset counter, not the live
 * committed value, so committing never remounts and drops focus). */
function SearchField({
  value,
  resetKey,
  onCommit,
}: {
  value: string;
  resetKey: number;
  onCommit: (q: string | undefined) => void;
}) {
  const commit = (raw: string) => {
    const next = raw.trim();
    onCommit(next === "" ? undefined : next);
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const input = event.currentTarget.elements.namedItem(
          "q",
        ) as HTMLInputElement | null;
        if (input) commit(input.value);
      }}
    >
      <Input
        key={resetKey}
        name="q"
        type="search"
        defaultValue={value}
        placeholder="Search make, model, segment"
        aria-label="Search cars"
        onBlur={(event) => commit(event.currentTarget.value)}
      />
    </form>
  );
}

/** Min/max price, committed on submit or blur; re-seeded on reset via `key`
 * (the reset counter, not the live committed values — keying on the committed
 * values would remount the form on each blur commit and steal focus while
 * tabbing Min → Max). */
function PriceRange({
  query,
  resetKey,
  onChange,
}: {
  query: CarQuery;
  resetKey: number;
  onChange: (patch: Partial<CarQuery>) => void;
}) {
  const commit = (form: HTMLFormElement) => {
    const read = (name: string) => {
      const el = form.elements.namedItem(name) as HTMLInputElement | null;
      const raw = el?.value.trim() ?? "";
      if (raw === "") return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    };
    onChange({ minPrice: read("minPrice"), maxPrice: read("maxPrice") });
  };
  return (
    <form
      key={resetKey}
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        commit(event.currentTarget);
      }}
      onBlur={(event) => commit(event.currentTarget)}
    >
      <Input
        name="minPrice"
        type="number"
        inputMode="numeric"
        min={0}
        step={1000}
        defaultValue={query.minPrice ?? ""}
        placeholder="Min $"
        aria-label="Minimum price in USD"
      />
      <span className="font-mono text-13 text-ink-soft">–</span>
      <Input
        name="maxPrice"
        type="number"
        inputMode="numeric"
        min={0}
        step={1000}
        defaultValue={query.maxPrice ?? ""}
        placeholder="Max $"
        aria-label="Maximum price in USD"
      />
    </form>
  );
}

/**
 * The left control-panel rail — every facet in the frozen `CarQuery` contract,
 * tuned like an instrument. Selecting a facet patches the query (the page keeps
 * the URL in sync). Used both as a sticky desktop aside and inside the mobile
 * filters dialog.
 */
export function Filters({
  query,
  facets,
  activeCount = 0,
  resetKey = 0,
  onChange,
  onReset,
  className,
}: FiltersProps) {
  const bodyStyles = facets?.bodyStyles ?? BODY_STYLE_FALLBACK;
  const makes = facets?.makes ?? [];

  const toggleBool = (key: keyof CarQuery, current: boolean | undefined) =>
    onChange({ [key]: current ? undefined : true } as Partial<CarQuery>);

  return (
    <div
      role="group"
      className={cx("flex flex-col gap-4", className)}
      aria-label="Filter cars"
    >
      <FilterSection label="Search">
        <SearchField
          value={query.q ?? ""}
          resetKey={resetKey}
          onCommit={(q) => onChange({ q })}
        />
      </FilterSection>

      <FilterSection label="Powertrain">
        <ChipRow<PowertrainT>
          options={Powertrain.options}
          selected={query.powertrain ?? []}
          onToggle={(value) =>
            onChange({ powertrain: toggleArr(query.powertrain, value) })
          }
          renderLabel={(value) => formatPowertrain(value)}
        />
      </FilterSection>

      <FilterSection label="Drivetrain">
        <ChipRow<DrivetrainT>
          options={Drivetrain.options}
          selected={query.drivetrain ?? []}
          onToggle={(value) =>
            onChange({ drivetrain: toggleArr(query.drivetrain, value) })
          }
        />
      </FilterSection>

      <FilterSection label="Body style">
        <ChipRow<string>
          options={bodyStyles}
          selected={query.bodyStyle ?? []}
          onToggle={(value) =>
            onChange({ bodyStyle: toggleArr(query.bodyStyle, value) })
          }
        />
      </FilterSection>

      <FilterSection label="Make">
        <ChipRow<string>
          options={makes}
          selected={query.make ?? []}
          onToggle={(value) => onChange({ make: toggleArr(query.make, value) })}
          scroll
          emptyHint="No makes to filter yet."
        />
      </FilterSection>

      <FilterSection label="Price (USD)">
        <PriceRange query={query} resetKey={resetKey} onChange={onChange} />
      </FilterSection>

      <FilterSection label="Min electric range">
        <Select
          value={query.minElectricRange ?? ""}
          aria-label="Minimum electric range"
          onChange={(event) =>
            onChange({
              minElectricRange: event.target.value
                ? Number(event.target.value)
                : undefined,
            })
          }
        >
          <option value="">Any</option>
          {ELECTRIC_RANGE_STEPS.map((mi) => (
            <option key={mi} value={mi}>
              {mi}+ mi
            </option>
          ))}
        </Select>
      </FilterSection>

      <FilterSection label="Min seats">
        <Select
          value={query.minSeating ?? ""}
          aria-label="Minimum seating capacity"
          onChange={(event) =>
            onChange({
              minSeating: event.target.value
                ? Number(event.target.value)
                : undefined,
            })
          }
        >
          <option value="">Any</option>
          {SEATING_STEPS.map((n) => (
            <option key={n} value={n}>
              {n}+ seats
            </option>
          ))}
        </Select>
      </FilterSection>

      <FilterSection label="Charge port">
        <ChipRow<string>
          options={CHARGE_PORTS}
          selected={query.chargePort ?? []}
          onToggle={(value) =>
            onChange({ chargePort: toggleArr(query.chargePort, value) })
          }
        />
      </FilterSection>

      <FilterSection label="Driver assist">
        <div className="flex flex-wrap gap-1.5">
          <Chip
            active={Boolean(query.needsAdaptiveCruise)}
            onClick={() =>
              toggleBool("needsAdaptiveCruise", query.needsAdaptiveCruise)
            }
          >
            Adaptive cruise
          </Chip>
          <Chip
            active={Boolean(query.needsLaneAssist)}
            onClick={() => toggleBool("needsLaneAssist", query.needsLaneAssist)}
          >
            Lane assist
          </Chip>
          <Chip
            active={Boolean(query.needsHandsFree)}
            onClick={() => toggleBool("needsHandsFree", query.needsHandsFree)}
          >
            Hands-free highway
          </Chip>
        </div>
      </FilterSection>

      <FilterSection label="Incentives">
        <Chip
          active={Boolean(query.taxCreditOnly)}
          onClick={() => toggleBool("taxCreditOnly", query.taxCreditOnly)}
        >
          Federal tax credit eligible
        </Chip>
      </FilterSection>

      <Button
        variant="secondary"
        className="w-full"
        onClick={onReset}
        disabled={activeCount === 0}
      >
        Reset all filters
      </Button>
    </div>
  );
}
