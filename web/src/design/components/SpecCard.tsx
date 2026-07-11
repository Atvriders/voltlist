import { Link, useNavigate } from "react-router-dom";
import type { Vehicle } from "@voltlist/shared";
import { cx } from "../../lib/cx";
import { Silhouette } from "../../lib/silhouette";
import {
  formatMiles,
  formatMoney,
  formatPowertrain,
} from "../../lib/format";
import { useFavorites, useToggleFavorite } from "../../api/favorites";
import { useCart, useToggleCart } from "../../api/cart";
import { useSession } from "../../state/session";
import { RangeMeter } from "./RangeMeter";
import { Badge, powertrainTone } from "./Badge";

const ACCENT_TEXT: Record<Vehicle["powertrainType"], string> = {
  BEV: "text-pt-bev",
  PHEV: "text-pt-phev",
  HEV: "text-pt-hev",
};

export interface SpecCardProps {
  car: Vehicle;
  className?: string;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-10-9.2C.6 9 1.7 5.5 5 5.1c2-.2 3.5 1 4.8 2.6C11 6.1 12.5 4.9 14.5 5.1c3.3.4 4.4 3.9 3 6.7C19.5 16.4 12 21 12 21Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The catalog/favorites card: brand wordmark, body silhouette tinted by the
 * powertrain accent, the signature RangeMeter, headline stats
 * (range / drivetrain / price), plus favorite + add-to-shortlist actions.
 */
export function SpecCard({ car, className }: SpecCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useSession();

  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const isFavorite = favorites?.includes(car.id) ?? false;

  const { data: cart } = useCart();
  const toggleCart = useToggleCart();
  const inCart = cart?.includes(car.id) ?? false;

  const requireAuth = (fn: () => void) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fn();
  };

  const headlineRange =
    car.powertrainType === "HEV" ? car.totalRangeMi : car.electricRangeMi;

  return (
    <article
      className={cx(
        "group flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card",
        "transition-transform duration-100 motion-safe:hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
      data-testid="spec-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="eyebrow text-ink-soft">{car.make}</div>
          <Link
            to={`/car/${car.id}`}
            className="block font-display text-xl font-semibold text-ink hover:text-voltage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage"
          >
            {car.model}
          </Link>
          <div className="font-mono text-13 text-ink-soft tabular-nums">
            {car.year} · {car.segment}
          </div>
        </div>
        <Badge tone={powertrainTone(car.powertrainType)}>
          {formatPowertrain(car.powertrainType)}
        </Badge>
      </div>

      <div className={cx("h-14", ACCENT_TEXT[car.powertrainType])}>
        <Silhouette
          bodyStyle={car.bodyStyle}
          className="h-full w-auto"
          title={`${car.make} ${car.model} (${car.bodyStyle})`}
        />
      </div>

      <RangeMeter
        powertrain={car.powertrainType}
        electricRangeMi={car.electricRangeMi}
        totalRangeMi={car.totalRangeMi}
      />

      <dl className="grid grid-cols-3 gap-2 border-t border-line pt-3">
        <div>
          <dt className="eyebrow text-ink-soft">Range</dt>
          <dd className="font-mono text-sm text-ink tabular-nums">
            {formatMiles(headlineRange)}
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-ink-soft">Drive</dt>
          <dd className="font-mono text-sm text-ink tabular-nums">
            {car.drivetrain}
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-ink-soft">Price</dt>
          <dd className="font-mono text-sm text-ink tabular-nums">
            {formatMoney(car.msrpBaseUsd)}
          </dd>
        </div>
      </dl>

      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            requireAuth(() =>
              toggleFavorite.mutate({ carId: car.id, isFavorite }),
            )
          }
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Remove ${car.model} from favorites`
              : `Save ${car.model} to favorites`
          }
          className={cx(
            "inline-flex h-9 w-9 items-center justify-center rounded-control border border-line",
            "transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage",
            isFavorite ? "text-voltage" : "text-ink-soft",
          )}
        >
          <HeartIcon filled={isFavorite} />
        </button>
        <button
          type="button"
          onClick={() =>
            requireAuth(() => toggleCart.mutate({ carId: car.id, inCart }))
          }
          aria-pressed={inCart}
          aria-label={
            inCart
              ? `In shortlist — ${car.model} (activate to remove)`
              : `Add to shortlist — ${car.model}`
          }
          className={cx(
            "inline-flex h-9 flex-1 items-center justify-center rounded-control border px-3 text-sm font-medium",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage",
            inCart
              ? "border-voltage bg-voltage text-white"
              : "border-line bg-surface text-ink hover:bg-surface-2",
          )}
        >
          {inCart ? "In shortlist" : "Add to shortlist"}
        </button>
      </div>
    </article>
  );
}
