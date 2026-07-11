import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart, useCompare, exportCartUrl, exportCompareUrl } from "../api";
import { useSession } from "../state/session";
import { Skeleton } from "../design/components";
import { CompareTable } from "../features/compare";

const EXPORT_LINK =
  "inline-flex h-10 items-center justify-center gap-2 rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage focus-visible:ring-offset-2";

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <p className="eyebrow text-ink-soft">Side by side</p>
        <h1 className="font-display text-28 font-semibold text-ink">Compare</h1>
      </header>
      {children}
    </main>
  );
}

function EmptyState({ authenticated }: { authenticated: boolean }) {
  return (
    <div className="rounded-card border border-line bg-surface p-8 text-center shadow-card">
      <p className="font-body text-ink">
        No vehicles to compare yet.
      </p>
      <p className="mt-1 font-body text-sm text-ink-soft">
        {authenticated
          ? "Add cars to your shortlist, then line them up side by side."
          : "Log in and add cars to your shortlist to compare them side by side."}
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Link
          to="/"
          className="inline-flex h-10 items-center justify-center rounded-control bg-voltage px-4 text-sm font-medium text-white transition-colors hover:bg-voltage-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage focus-visible:ring-offset-2"
        >
          Browse the catalog
        </Link>
        {!authenticated && (
          <Link to="/login" className={EXPORT_LINK}>
            Log in
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Compare() {
  const [params] = useSearchParams();
  const { isAuthenticated } = useSession();
  const idsParam = params.get("ids");
  const usingCart = idsParam == null;

  const cartQuery = useCart();
  const sourceIds = usingCart ? cartQuery.data ?? [] : idsParam.split(",");
  const ids = sourceIds.map((s) => s.trim()).filter(Boolean).slice(0, 4);

  const compare = useCompare(ids);
  const cars = compare.data?.items ?? [];

  // In cart-mode export the signed-in cart; in ids deep-link mode export the
  // exact vehicles on screen via the public ids endpoint (never the cart).
  const exportUrl = (format: "csv" | "pdf") =>
    usingCart ? exportCartUrl(format) : exportCompareUrl(ids, format);

  // Still resolving where the ids come from, or fetching the vehicles.
  const loading =
    (usingCart && cartQuery.isLoading) ||
    (ids.length > 0 && compare.isLoading);

  if (loading) {
    return (
      <Shell>
        <Skeleton height={360} className="w-full" />
      </Shell>
    );
  }

  if (ids.length === 0 || cars.length === 0) {
    return (
      <Shell>
        <EmptyState authenticated={isAuthenticated} />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-13 tabular-nums text-ink-soft">
          {cars.length} {cars.length === 1 ? "vehicle" : "vehicles"}
          {ids.length >= 4 ? " · showing first 4" : ""}
        </p>
        <div className="flex items-center gap-2">
          <a href={exportUrl("csv")} download className={EXPORT_LINK}>
            Export CSV
          </a>
          <a href={exportUrl("pdf")} download className={EXPORT_LINK}>
            Export PDF
          </a>
        </div>
      </div>
      <CompareTable cars={cars} />
    </Shell>
  );
}
