import { Link } from "react-router-dom";
import { useCart, useToggleCart, exportCartUrl } from "../api/cart";
import { useCar } from "../api/cars";
import {
  Badge,
  Button,
  RangeMeter,
  Skeleton,
  powertrainTone,
} from "../design/components";
import {
  formatMoney,
  formatPowertrain,
  formatSeats,
} from "../lib/format";

/** Max cars the compare matrix accepts (server caps `/api/compare` at 4). */
const COMPARE_MAX = 4;

const PRIMARY_BTN =
  "inline-flex h-10 items-center justify-center gap-2 rounded-control bg-voltage px-4 text-sm font-medium text-white transition-colors hover:bg-voltage-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage focus-visible:ring-offset-2";
const SECONDARY_BTN =
  "inline-flex h-10 items-center justify-center gap-2 rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage focus-visible:ring-offset-2";
const DEEP_LINK =
  "inline-flex items-center gap-1 font-mono text-13 text-voltage underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage";

/**
 * A single shortlisted car, fetched by id. Its own component so the number of
 * `useCar` hooks stays stable as the cart changes. A dangling id (car no longer
 * loads) still renders a removable row so the shortlist can be cleaned up.
 */
function CartRow({ carId }: { carId: string }) {
  const { data: car, isLoading, isError } = useCar(carId);
  const toggleCart = useToggleCart();
  const remove = () => toggleCart.mutate({ carId, inCart: true });

  if (isLoading) {
    return (
      <li>
        <Skeleton height={128} className="rounded-card" />
      </li>
    );
  }

  if (isError || !car) {
    return (
      <li className="flex items-center justify-between rounded-card border border-line bg-surface p-4 shadow-card">
        <span className="font-mono text-13 text-ink-soft">
          {carId} (unavailable)
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          aria-label={`Remove ${carId} from shortlist`}
        >
          Remove
        </Button>
      </li>
    );
  }

  return (
    <li className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow text-ink-soft">{car.make}</div>
          <Link
            to={`/car/${car.id}`}
            className="block font-display text-lg font-semibold text-ink hover:text-voltage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
          >
            {car.model}
          </Link>
          <div className="font-mono text-13 tabular-nums text-ink-soft">
            {car.year} · {car.segment}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={powertrainTone(car.powertrainType)}>
            {formatPowertrain(car.powertrainType)}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={remove}
            aria-label={`Remove ${car.model} from shortlist`}
          >
            Remove
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <RangeMeter
          powertrain={car.powertrainType}
          electricRangeMi={car.electricRangeMi}
          totalRangeMi={car.totalRangeMi}
          size="md"
        />
        <dl className="flex gap-5">
          <div>
            <dt className="eyebrow text-ink-soft">Price</dt>
            <dd className="font-mono text-sm tabular-nums text-ink">
              {formatMoney(car.msrpBaseUsd)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-soft">Drive</dt>
            <dd className="font-mono text-sm tabular-nums text-ink">
              {car.drivetrain}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-soft">Seats</dt>
            <dd className="font-mono text-sm tabular-nums text-ink">
              {formatSeats(car.seatingCapacity)}
            </dd>
          </div>
        </dl>
      </div>

      {(car.buildAndPriceUrl || car.manufacturerUrl) && (
        <div className="mt-3 flex flex-wrap gap-4 border-t border-line pt-3">
          {car.buildAndPriceUrl && (
            <a
              href={car.buildAndPriceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={DEEP_LINK}
            >
              Build &amp; price ↗
            </a>
          )}
          {car.manufacturerUrl && (
            <a
              href={car.manufacturerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={DEEP_LINK}
            >
              Manufacturer site ↗
            </a>
          )}
        </div>
      )}
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-line bg-surface p-10 text-center shadow-card">
      <h2 className="font-display text-xl font-semibold text-ink">
        Your shortlist is empty
      </h2>
      <p className="mx-auto mt-2 max-w-md font-body text-sm text-ink-soft">
        Add cars to your shortlist to line them up side by side and export the
        specs. Look for &ldquo;Add to shortlist&rdquo; on any car.
      </p>
      <Link to="/" className={`mt-5 ${PRIMARY_BTN}`}>
        Browse the catalog
      </Link>
    </div>
  );
}

export default function Cart() {
  const { data: ids, isLoading, isError } = useCart();
  const count = ids?.length ?? 0;
  const compareCount = Math.min(count, COMPARE_MAX);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow text-ink-soft">Shortlist</div>
          <h1 className="font-display text-28 font-semibold text-ink">
            Your shortlist
          </h1>
          <p
            data-testid="cart-count"
            className="mt-1 font-mono text-13 tabular-nums text-ink-soft"
          >
            {`${count} ${count === 1 ? "car" : "cars"}`}
          </p>
        </div>

        {count > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/compare" className={PRIMARY_BTN}>
              {`Compare ${compareCount}`}
            </Link>
            <a href={exportCartUrl("csv")} download className={SECONDARY_BTN}>
              Export CSV
            </a>
            <a href={exportCartUrl("pdf")} download className={SECONDARY_BTN}>
              Export PDF
            </a>
          </div>
        )}
      </header>

      {isLoading ? (
        <ul className="grid gap-4" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i}>
              <Skeleton height={128} className="rounded-card" />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center shadow-card">
          <h2 className="font-display text-xl font-semibold text-ink">
            Couldn&rsquo;t load your shortlist
          </h2>
          <p className="mx-auto mt-2 max-w-md font-body text-sm text-ink-soft">
            Something went wrong reaching the server. Try again in a moment.
          </p>
        </div>
      ) : count === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid gap-4">
          {ids!.map((id) => (
            <CartRow key={id} carId={id} />
          ))}
        </ul>
      )}
    </main>
  );
}
