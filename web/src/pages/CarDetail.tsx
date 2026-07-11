import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Vehicle } from "@voltlist/shared";
import {
  useCar,
  useCart,
  useFavorites,
  useToggleCart,
  useToggleFavorite,
} from "../api";
import { useSession } from "../state/session";
import {
  Badge,
  Button,
  Chip,
  RangeMeter,
  Skeleton,
  powertrainTone,
} from "../design/components";
import type { BadgeTone } from "../design/components";
import { TrimTable } from "../features/detail/TrimTable";
import { Silhouette } from "../lib/silhouette";
import { cx } from "../lib/cx";
import {
  DASH,
  formatCuFt,
  formatGal,
  formatHp,
  formatInches,
  formatKw,
  formatKwh,
  formatMiPerKwh,
  formatMiles,
  formatMoney,
  formatMpg,
  formatMpge,
  formatMph,
  formatNumber,
  formatPowertrain,
  formatSeats,
  formatSeconds,
  formatTorque,
  formatTowing,
  formatWeight,
} from "../lib/format";

const ACCENT_TEXT: Record<Vehicle["powertrainType"], string> = {
  BEV: "text-pt-bev",
  PHEV: "text-pt-phev",
  HEV: "text-pt-hev",
};

type Availability = Vehicle["adas"]["adaptiveCruiseControl"];

const AVAILABILITY: Record<Availability, { label: string; tone: BadgeTone }> = {
  Standard: { label: "Standard", tone: "good" },
  Optional: { label: "Optional", tone: "voltage" },
  NotAvailable: { label: "Not available", tone: "neutral" },
};

function formatMinutes(v: number | null | undefined): string {
  return v == null ? DASH : `${formatNumber(v)} min`;
}

/** A labeled datasheet block: an eyebrow title over a mono value grid. */
function Readout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-card">
      <h2 className="eyebrow mb-4 text-ink-soft">{title}</h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</dl>
    </section>
  );
}

/** One label + mono value pair inside a Readout grid. */
function Spec({
  label,
  value,
  wide,
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="eyebrow text-ink-soft">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm text-ink tabular-nums">{value}</dd>
    </div>
  );
}

/** An ADAS availability row rendered as a Standard/Optional/absent badge. */
function AdasSpec({ label, value }: { label: string; value: Availability }) {
  const a = AVAILABILITY[value];
  return (
    <Spec
      label={label}
      value={<Badge tone={a.tone}>{a.label}</Badge>}
    />
  );
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

const DEEP_LINK_CLASS =
  "inline-flex h-10 items-center justify-center gap-2 rounded-control border border-line bg-surface px-4 font-body text-sm font-medium text-ink transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage focus-visible:ring-offset-2";

function DetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="car-detail-loading">
      <Skeleton height={180} className="w-full" />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={160} className="w-full" />
        ))}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="rounded-card border border-line bg-surface p-8 text-center shadow-card">
      <h1 className="font-display text-28 font-semibold text-ink">
        Car not found
      </h1>
      <p className="mt-2 text-ink-soft">
        We couldn&apos;t find that vehicle. It may have been removed or the link
        is out of date.
      </p>
      <Link
        to="/"
        className="mt-4 inline-block font-medium text-voltage hover:underline"
      >
        Back to the catalog
      </Link>
    </div>
  );
}

export default function CarDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: car, isLoading, isError } = useCar(id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link
        to="/"
        className="eyebrow inline-block text-ink-soft transition-colors hover:text-voltage"
      >
        &larr; Back to catalog
      </Link>

      <div className="mt-4">
        {isLoading ? (
          <DetailSkeleton />
        ) : isError || !car ? (
          <NotFound />
        ) : (
          <CarSheet key={car.id} car={car} />
        )}
      </div>
    </main>
  );
}

function CarSheet({ car }: { car: Vehicle }) {
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

  const { adas } = car;
  const taxCredit =
    car.federalTaxCreditEligible == null ? null : car.federalTaxCreditEligible;

  // Trim selection drives the hero readout. Default = the base (first) trim.
  // Fields fall back to the model-level value when a trim leaves them null.
  const trims = car.trims;
  const [trimIndex, setTrimIndex] = useState(0);
  const activeIndex = trims.length ? Math.min(trimIndex, trims.length - 1) : 0;
  const trim = trims.length ? trims[activeIndex] : null;

  const heroElectricRangeMi = trim?.electricRangeMi ?? car.electricRangeMi;
  const heroDrivetrain = trim?.drivetrain ?? car.drivetrain;
  const heroHorsepower = trim?.horsepower ?? car.horsepower;
  const heroZeroToSixty = trim?.zeroToSixtySec ?? car.zeroToSixtySec;
  const heroPrice = trim?.msrpUsd ?? car.msrpBaseUsd;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="eyebrow text-ink-soft">{car.make}</div>
            <h1 className="font-display text-40 font-bold text-ink">
              {car.model}
            </h1>
            <div className="mt-1 font-mono text-13 text-ink-soft tabular-nums">
              {car.year} &middot; {car.segment} &middot; {car.bodyStyle}
            </div>
            <p className="mt-1 max-w-prose text-sm text-ink-soft">
              {car.trimsSummary}
            </p>
          </div>
          <Badge tone={powertrainTone(car.powertrainType)}>
            {formatPowertrain(car.powertrainType)}
          </Badge>
        </div>

        <div className={cx("mt-5 h-16", ACCENT_TEXT[car.powertrainType])}>
          <Silhouette
            bodyStyle={car.bodyStyle}
            className="h-full w-auto"
            title={`${car.make} ${car.model} (${car.bodyStyle})`}
          />
        </div>

        {trims.length > 0 && (
          <div className="mt-5">
            <div className="eyebrow mb-2 text-ink-soft">Trim</div>
            <div
              role="group"
              aria-label="Select trim"
              className="flex flex-wrap gap-2"
            >
              {trims.map((t, i) => (
                <Chip
                  key={`${t.name}-${i}`}
                  active={i === activeIndex}
                  onClick={() => setTrimIndex(i)}
                >
                  {t.name}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <RangeMeter
            powertrain={car.powertrainType}
            electricRangeMi={heroElectricRangeMi}
            totalRangeMi={car.totalRangeMi}
            size="md"
          />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
          <div>
            <dt className="eyebrow text-ink-soft">Drivetrain</dt>
            <dd className="mt-0.5 font-mono text-sm text-ink tabular-nums">
              {heroDrivetrain}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-soft">0&ndash;60 mph</dt>
            <dd className="mt-0.5 font-mono text-sm text-ink tabular-nums">
              {formatSeconds(heroZeroToSixty)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-soft">Power</dt>
            <dd className="mt-0.5 font-mono text-sm text-ink tabular-nums">
              {formatHp(heroHorsepower)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-ink-soft">
              {trim ? "Price" : "Base price"}
            </dt>
            <dd
              data-testid="hero-price"
              className="mt-0.5 font-mono text-sm text-ink tabular-nums"
            >
              {formatMoney(heroPrice)}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-2">
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
              "inline-flex h-10 w-10 items-center justify-center rounded-control border border-line",
              "transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage",
              isFavorite ? "text-voltage" : "text-ink-soft",
            )}
          >
            <HeartIcon filled={isFavorite} />
          </button>
          <Button
            variant={inCart ? "primary" : "secondary"}
            onClick={() =>
              requireAuth(() => toggleCart.mutate({ carId: car.id, inCart }))
            }
            aria-pressed={inCart}
            aria-label={
              inCart
                ? `In shortlist — ${car.model} (activate to remove)`
                : `Add to shortlist — ${car.model}`
            }
          >
            {inCart ? "In shortlist" : "Add to shortlist"}
          </Button>
          {car.buildAndPriceUrl && (
            <a
              href={car.buildAndPriceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={DEEP_LINK_CLASS}
            >
              Build &amp; Price
            </a>
          )}
          {car.manufacturerUrl && (
            <a
              href={car.manufacturerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={DEEP_LINK_CLASS}
            >
              Manufacturer site
            </a>
          )}
        </div>
      </section>

      {/* Trim comparison — one row per trim, mono spec columns */}
      {trims.length > 0 && (
        <TrimTable
          trims={trims}
          powertrain={car.powertrainType}
          selectedIndex={activeIndex}
        />
      )}

      {/* Grouped readout blocks */}
      <div className="grid gap-6 md:grid-cols-2">
        <Readout title="Powertrain">
          <Spec label="Type" value={formatPowertrain(car.powertrainType)} />
          <Spec label="Electric range" value={formatMiles(car.electricRangeMi)} />
          <Spec label="Total range" value={formatMiles(car.totalRangeMi)} />
          <Spec label="MPGe" value={formatMpge(car.mpge)} />
          <Spec label="MPG combined" value={formatMpg(car.mpgCombined)} />
          <Spec
            label="Efficiency"
            value={formatMiPerKwh(car.efficiencyMiPerKwh)}
          />
          <Spec label="Battery usable" value={formatKwh(car.batteryKwhUsable)} />
          <Spec label="Battery total" value={formatKwh(car.batteryKwhTotal)} />
          <Spec label="Fuel tank" value={formatGal(car.fuelTankGal)} />
        </Readout>

        <Readout title="Charging">
          <Spec label="DC fast (max)" value={formatKw(car.dcFastMaxKw)} />
          <Spec
            label="DC fast 10–80%"
            value={formatMinutes(car.dcFast10to80Min)}
          />
          <Spec label="AC onboard" value={formatKw(car.acOnboardKw)} />
          <Spec label="Charge port" value={car.chargePort ?? DASH} />
        </Readout>

        <Readout title="Drivetrain & Performance">
          <Spec label="Drivetrain" value={car.drivetrain} />
          <Spec label="Motor layout" value={car.motorLayout ?? DASH} />
          <Spec label="Horsepower" value={formatHp(car.horsepower)} />
          <Spec label="Torque" value={formatTorque(car.torqueLbFt)} />
          <Spec label="0–60 mph" value={formatSeconds(car.zeroToSixtySec)} />
          <Spec label="Top speed" value={formatMph(car.topSpeedMph)} />
          <Spec label="Towing" value={formatTowing(car.towingCapacityLb)} />
        </Readout>

        <Readout title="Driver Assist">
          <Spec label="System" value={adas.systemName ?? DASH} wide />
          <Spec label="Autonomy level" value={adas.autonomyLevel} />
          <AdasSpec
            label="Adaptive cruise control"
            value={adas.adaptiveCruiseControl}
          />
          <AdasSpec label="Lane keep assist" value={adas.laneKeepAssist} />
          <AdasSpec label="Lane centering" value={adas.laneCentering} />
          <AdasSpec label="Hands-free highway" value={adas.handsFreeHighway} />
          <AdasSpec
            label="Automatic emergency braking"
            value={adas.automaticEmergencyBraking}
          />
          <AdasSpec
            label="Blind-spot monitoring"
            value={adas.blindSpotMonitoring}
          />
          <AdasSpec label="Self-parking" value={adas.selfParking} />
        </Readout>

        <Readout title="Dimensions">
          <Spec label="Length" value={formatInches(car.lengthIn)} />
          <Spec label="Width" value={formatInches(car.widthIn)} />
          <Spec label="Height" value={formatInches(car.heightIn)} />
          <Spec label="Wheelbase" value={formatInches(car.wheelbaseIn)} />
          <Spec
            label="Ground clearance"
            value={formatInches(car.groundClearanceIn)}
          />
          <Spec label="Cargo" value={formatCuFt(car.cargoCuFt)} />
          <Spec label="Frunk" value={formatCuFt(car.frunkCuFt)} />
          <Spec label="Seating" value={formatSeats(car.seatingCapacity)} />
          <Spec label="Curb weight" value={formatWeight(car.curbWeightLb)} />
        </Readout>

        <Readout title="Ownership">
          <Spec label="Base MSRP" value={formatMoney(car.msrpBaseUsd)} />
          <Spec label="Top MSRP" value={formatMoney(car.msrpTopUsd)} />
          <Spec
            label="Federal tax credit"
            value={
              taxCredit == null ? (
                DASH
              ) : (
                <Badge tone={taxCredit ? "good" : "neutral"}>
                  {taxCredit ? "Eligible" : "Not eligible"}
                </Badge>
              )
            }
          />
          {car.federalTaxCreditNote && (
            <Spec label="Tax credit note" value={car.federalTaxCreditNote} wide />
          )}
          <Spec label="Basic warranty" value={car.warrantyBasic ?? DASH} />
          <Spec
            label="Powertrain warranty"
            value={car.warrantyPowertrain ?? DASH}
          />
          <Spec label="Battery warranty" value={car.warrantyBattery ?? DASH} />
        </Readout>
      </div>

      {/* Sources / provenance */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-card">
        <h2 className="eyebrow mb-3 text-ink-soft">Sources</h2>
        <ul className="space-y-2">
          {car.sources.map((s, i) => (
            <li
              key={`${s.url}-${i}`}
              className="flex flex-wrap items-baseline gap-x-2 font-mono text-13 tabular-nums"
            >
              {s.field && <span className="text-ink-soft">{s.field}:</span>}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-voltage hover:underline"
              >
                {s.url}
              </a>
              <span className="text-ink-soft">as of {s.asOf}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-13 text-ink-soft tabular-nums">
          Record compiled {car.dataAsOf}
        </p>
      </section>
    </div>
  );
}
