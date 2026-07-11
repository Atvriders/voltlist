import { Link } from "react-router-dom";
import { useFavorites } from "../api/favorites";
import { useCar } from "../api/cars";
import { SpecCard, Skeleton } from "../design/components";

/**
 * Fetches a single favorited car by id and renders its SpecCard. Each favorite
 * is its own component so the number of `useCar` hooks stays stable as the
 * favorites list changes (mount/unmount instead of a variable-length hook loop).
 */
function FavoriteCard({ carId }: { carId: string }) {
  const { data: car, isLoading, isError } = useCar(carId);
  if (isLoading) {
    return <Skeleton height={340} className="rounded-card" />;
  }
  // A favorite pointing at a car that no longer loads is silently skipped.
  if (isError || !car) return null;
  return <SpecCard car={car} />;
}

function EmptyState() {
  return (
    <div className="rounded-card border border-line bg-surface p-10 text-center shadow-card">
      <h2 className="font-display text-xl font-semibold text-ink">
        No favorites yet
      </h2>
      <p className="mx-auto mt-2 max-w-md font-body text-sm text-ink-soft">
        Tap the heart on any car to save it here. Favorites sync to your account,
        so they follow you across devices.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex h-10 items-center justify-center rounded-control bg-voltage px-4 text-sm font-medium text-white transition-colors hover:bg-voltage-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage focus-visible:ring-offset-2"
      >
        Browse the catalog
      </Link>
    </div>
  );
}

const GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

export default function Favorites() {
  const { data: ids, isLoading, isError } = useFavorites();
  const count = ids?.length ?? 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <div className="eyebrow text-ink-soft">Saved</div>
        <h1 className="font-display text-28 font-semibold text-ink">Favorites</h1>
        <p className="mt-1 font-mono text-13 tabular-nums text-ink-soft">
          {`${count} ${count === 1 ? "car" : "cars"} saved`}
        </p>
      </header>

      {isLoading ? (
        <div className={GRID} aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={340} className="rounded-card" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-card border border-line bg-surface p-10 text-center shadow-card">
          <h2 className="font-display text-xl font-semibold text-ink">
            Couldn&rsquo;t load your favorites
          </h2>
          <p className="mx-auto mt-2 max-w-md font-body text-sm text-ink-soft">
            Something went wrong reaching the server. Try again in a moment.
          </p>
        </div>
      ) : count === 0 ? (
        <EmptyState />
      ) : (
        <section aria-label="Favorited cars" className={GRID}>
          {ids!.map((id) => (
            <FavoriteCard key={id} carId={id} />
          ))}
        </section>
      )}
    </main>
  );
}
