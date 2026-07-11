import type { CarQuery } from "@voltlist/shared";
import { Button, Select } from "../../design/components";
import { cx } from "../../lib/cx";

type SortKey = NonNullable<CarQuery["sort"]>;
type SortOrder = NonNullable<CarQuery["order"]>;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "price", label: "Price" },
  { value: "range", label: "Electric range" },
  { value: "zeroToSixty", label: "0–60 mph" },
  { value: "efficiency", label: "Efficiency" },
  { value: "horsepower", label: "Horsepower" },
];

export interface SortBarProps {
  sort?: CarQuery["sort"];
  order?: CarQuery["order"];
  /** Patch the query with a new sort key and/or order. */
  onChange: (patch: Pick<CarQuery, "sort" | "order">) => void;
  className?: string;
}

/**
 * Sort controls for the catalog: a key selector plus an ascending/descending
 * toggle. The toggle is disabled until a sort key is chosen.
 */
export function SortBar({ sort, order, onChange, className }: SortBarProps) {
  const activeOrder: SortOrder = order ?? "asc";

  const onKeyChange = (value: string) => {
    if (value === "") {
      onChange({ sort: undefined, order: undefined });
      return;
    }
    onChange({ sort: value as SortKey, order: activeOrder });
  };

  const toggleOrder = () => {
    if (!sort) return;
    onChange({ sort, order: activeOrder === "asc" ? "desc" : "asc" });
  };

  return (
    <div className={cx("flex items-center gap-2", className)}>
      <label htmlFor="catalog-sort" className="eyebrow text-ink-soft">
        Sort
      </label>
      <div className="w-44">
        <Select
          id="catalog-sort"
          value={sort ?? ""}
          aria-label="Sort by"
          onChange={(event) => onKeyChange(event.target.value)}
        >
          <option value="">Best match</option>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <Button
        variant="secondary"
        disabled={!sort}
        onClick={toggleOrder}
        aria-label={`Sort direction: ${
          activeOrder === "asc" ? "ascending" : "descending"
        }`}
        title="Toggle sort direction"
      >
        <span aria-hidden="true">{activeOrder === "asc" ? "↑" : "↓"}</span>
        <span className="font-mono text-13">
          {activeOrder === "asc" ? "Low–High" : "High–Low"}
        </span>
      </Button>
    </div>
  );
}
