import type { CarListResult } from "@voltlist/shared";
import { Button, SpecCard, Skeleton } from "../../design/components";
import { formatNumber } from "../../lib/format";
import { cx } from "../../lib/cx";

export interface ResultsGridProps {
  result?: CarListResult;
  isLoading: boolean;
  isError: boolean;
  /** Clear all filters (offered in the empty state). */
  onReset?: () => void;
  className?: string;
}

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

/**
 * The catalog results column: a live result count, a grid of SpecCards, and
 * loading / empty / error states written in the interface's voice.
 */
export function ResultsGrid({
  result,
  isLoading,
  isError,
  onReset,
  className,
}: ResultsGridProps) {
  const total = result?.total ?? 0;
  const items = result?.items ?? [];

  const countLabel = isLoading
    ? "Loading cars…"
    : isError
      ? "Couldn't load cars"
      : `${formatNumber(total)} ${total === 1 ? "car" : "cars"}`;

  return (
    <div className={className}>
      <p
        className="mb-3 font-mono text-13 tabular-nums text-ink-soft"
        aria-live="polite"
      >
        {countLabel}
      </p>

      {isError ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center">
          <p className="font-display text-xl text-ink">
            Couldn't load the catalog.
          </p>
          <p className="mt-1 text-ink-soft">
            Check your connection and try again.
          </p>
        </div>
      ) : isLoading ? (
        <div className={GRID} aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={280} className="w-full rounded-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-surface p-10 text-center">
          <p className="font-display text-xl text-ink">
            No cars match these filters.
          </p>
          <p className="mt-1 text-ink-soft">Loosen a filter to see more.</p>
          {onReset && (
            <Button variant="secondary" className="mt-4" onClick={onReset}>
              Reset all filters
            </Button>
          )}
        </div>
      ) : (
        <div className={cx(GRID)}>
          {items.map((car) => (
            <SpecCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  );
}
