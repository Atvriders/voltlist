import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Powertrain, Drivetrain } from "@voltlist/shared";
import type { CarQuery } from "@voltlist/shared";
import { buildCarQueryString, useCars } from "../api";
import { Button, Dialog } from "../design/components";
import { Filters, ResultsGrid, SortBar } from "../features/catalog";

type PowertrainT = NonNullable<CarQuery["powertrain"]>[number];
type DrivetrainT = NonNullable<CarQuery["drivetrain"]>[number];
type SortKey = NonNullable<CarQuery["sort"]>;

const SORT_KEYS: readonly string[] = [
  "price",
  "range",
  "zeroToSixty",
  "efficiency",
  "horsepower",
];
const POWERTRAINS: readonly string[] = Powertrain.options;
const DRIVETRAINS: readonly string[] = Drivetrain.options;

function isPowertrain(value: string): value is PowertrainT {
  return POWERTRAINS.includes(value);
}
function isDrivetrain(value: string): value is DrivetrainT {
  return DRIVETRAINS.includes(value);
}
function isSortKey(value: string | null): value is SortKey {
  return value != null && SORT_KEYS.includes(value);
}

function numOrUndef(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse the URL search params into the frozen CarQuery shape (the inverse of
 * `buildCarQueryString`, which the api hook uses to serialize back out). */
function parseCarQuery(sp: URLSearchParams): CarQuery {
  const query: CarQuery = {};

  const q = sp.get("q");
  if (q) query.q = q;

  const powertrain = sp.getAll("powertrain").filter(isPowertrain);
  if (powertrain.length) query.powertrain = powertrain;

  const make = sp.getAll("make");
  if (make.length) query.make = make;

  const bodyStyle = sp.getAll("bodyStyle");
  if (bodyStyle.length) query.bodyStyle = bodyStyle;

  const drivetrain = sp.getAll("drivetrain").filter(isDrivetrain);
  if (drivetrain.length) query.drivetrain = drivetrain;

  const chargePort = sp.getAll("chargePort");
  if (chargePort.length) query.chargePort = chargePort;

  const minPrice = numOrUndef(sp.get("minPrice"));
  if (minPrice != null) query.minPrice = minPrice;
  const maxPrice = numOrUndef(sp.get("maxPrice"));
  if (maxPrice != null) query.maxPrice = maxPrice;
  const minElectricRange = numOrUndef(sp.get("minElectricRange"));
  if (minElectricRange != null) query.minElectricRange = minElectricRange;
  const minSeating = numOrUndef(sp.get("minSeating"));
  if (minSeating != null) query.minSeating = minSeating;

  if (sp.get("taxCreditOnly") === "true") query.taxCreditOnly = true;
  if (sp.get("needsAdaptiveCruise") === "true")
    query.needsAdaptiveCruise = true;
  if (sp.get("needsLaneAssist") === "true") query.needsLaneAssist = true;
  if (sp.get("needsHandsFree") === "true") query.needsHandsFree = true;

  const sort = sp.get("sort");
  if (isSortKey(sort)) query.sort = sort;
  const order = sp.get("order");
  if (order === "asc" || order === "desc") query.order = order;

  const page = numOrUndef(sp.get("page"));
  if (page != null && page > 1) query.page = page;

  return query;
}

function countActiveFilters(q: CarQuery): number {
  let n = 0;
  if (q.q) n += 1;
  n += q.powertrain?.length ?? 0;
  n += q.make?.length ?? 0;
  n += q.bodyStyle?.length ?? 0;
  n += q.drivetrain?.length ?? 0;
  n += q.chargePort?.length ?? 0;
  if (q.minPrice != null) n += 1;
  if (q.maxPrice != null) n += 1;
  if (q.minElectricRange != null) n += 1;
  if (q.minSeating != null) n += 1;
  if (q.taxCreditOnly) n += 1;
  if (q.needsAdaptiveCruise) n += 1;
  if (q.needsLaneAssist) n += 1;
  if (q.needsHandsFree) n += 1;
  return n;
}

/**
 * The catalog: a left control-panel rail of every facet (synced to the URL for
 * shareable filtered views), a sort bar, and the results grid of spec cards.
 * The rail collapses into a dialog on small screens.
 */
export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => parseCarQuery(searchParams), [searchParams]);
  const carsQuery = useCars(query);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  // Bumped only on reset, so the uncontrolled filter inputs re-seed from the
  // cleared query without remounting (and losing focus) on every live commit.
  const [resetKey, setResetKey] = useState(0);

  const applyPatch = useCallback(
    (patch: Partial<CarQuery>) => {
      const next: CarQuery = { ...query, ...patch };
      // Any facet or sort change returns to the first page.
      if (!("page" in patch)) delete next.page;
      setSearchParams(buildCarQueryString(next).replace(/^\?/, ""));
    },
    [query, setSearchParams],
  );

  const reset = useCallback(() => {
    setSearchParams("");
    setMobileFiltersOpen(false);
    setResetKey((k) => k + 1);
  }, [setSearchParams]);

  const activeCount = countActiveFilters(query);

  const filters = (
    <Filters
      query={query}
      facets={carsQuery.data?.facets}
      activeCount={activeCount}
      resetKey={resetKey}
      onChange={applyPatch}
      onReset={reset}
    />
  );

  const page = carsQuery.data?.page ?? 1;
  const pageSize = carsQuery.data?.pageSize ?? 24;
  const total = carsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="font-display text-28 text-ink sm:text-40">Catalog</h1>
        <p className="mt-1 text-ink-soft">
          Every new EV, plug-in hybrid, and hybrid sold in the USA — MY2024–2026,
          fully specced.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-card border border-line bg-surface p-4 shadow-card">
            {filters}
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="secondary"
              className="lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </Button>
            <SortBar
              sort={query.sort}
              order={query.order}
              onChange={applyPatch}
              className="ml-auto"
            />
          </div>

          <ResultsGrid
            result={carsQuery.data}
            isLoading={carsQuery.isLoading}
            isError={carsQuery.isError}
            onReset={reset}
          />

          {totalPages > 1 && (
            <nav
              className="mt-6 flex items-center justify-center gap-3"
              aria-label="Pagination"
            >
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => applyPatch({ page: page - 1 })}
              >
                Previous
              </Button>
              <span className="font-mono text-13 tabular-nums text-ink-soft">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => applyPatch({ page: page + 1 })}
              >
                Next
              </Button>
            </nav>
          )}
        </section>
      </div>

      <Dialog
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
        className="max-h-[85vh] overflow-y-auto"
      >
        {filters}
      </Dialog>
    </main>
  );
}
