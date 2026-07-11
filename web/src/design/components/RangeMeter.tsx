import { useEffect, useState } from "react";
import type { Vehicle } from "@voltlist/shared";
import { cx } from "../../lib/cx";
import { formatMiles } from "../../lib/format";

/** Fixed scale so bars are comparable across every card / compare column. */
export const RANGE_METER_MAX = 520;

export interface RangeMeterProps {
  powertrain: Vehicle["powertrainType"];
  electricRangeMi: number | null;
  totalRangeMi: number | null;
  /** Scale maximum in miles (default 520). */
  max?: number;
  /** Show the mono numeric readout above the bar (default true). */
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduce;
}

const GAS_HATCH =
  "repeating-linear-gradient(45deg, rgba(0,0,0,0.10) 0 3px, transparent 3px 6px)";

/**
 * The signature element. BEV: solid electric fill. PHEV: split fill — violet
 * electric segment then a hatched amber gas segment. HEV: solid total fill.
 * Animates width 0→value once on mount unless reduced motion is requested.
 */
export function RangeMeter({
  powertrain,
  electricRangeMi,
  totalRangeMi,
  max = RANGE_METER_MAX,
  showValue = true,
  size = "sm",
  className,
}: RangeMeterProps) {
  const reduce = usePrefersReducedMotion();
  const [filled, setFilled] = useState(reduce);

  useEffect(() => {
    if (reduce) {
      setFilled(true);
      return;
    }
    const id = window.setTimeout(() => setFilled(true), 30);
    return () => window.clearTimeout(id);
  }, [reduce]);

  const pct = (mi: number) => `${Math.max(0, Math.min(100, (mi / max) * 100))}%`;
  const transition = reduce ? undefined : "width 500ms ease-out";

  const electric = electricRangeMi ?? 0;
  const total = totalRangeMi ?? 0;
  // PHEV split: derive the gas segment from the total (not electric+gas) so the
  // two segments never sum past 100% and keep their true electric:gas
  // proportion even when the total exceeds the fixed scale.
  const electricPct = Math.min(100, (electric / max) * 100);
  const gasPct = Math.max(0, Math.min(100, (total / max) * 100) - electricPct);

  const trackH = size === "md" ? "h-2.5" : "h-1.5";
  const valueText = size === "md" ? "text-sm" : "text-13";

  let readout: string;
  let ariaValue: number;
  if (powertrain === "BEV") {
    readout = `${formatMiles(electricRangeMi)} electric`;
    ariaValue = electric;
  } else if (powertrain === "HEV") {
    readout = `${formatMiles(totalRangeMi)} total`;
    ariaValue = total;
  } else {
    readout =
      totalRangeMi != null
        ? `${formatMiles(electricRangeMi)} electric · ${formatMiles(totalRangeMi)} total`
        : `${formatMiles(electricRangeMi)} electric`;
    ariaValue = totalRangeMi != null ? total : electric;
  }

  return (
    <div className={cx("w-full", className)} data-testid="range-meter">
      {showValue && (
        <div className={cx("mb-1 font-mono tabular-nums text-ink", valueText)}>
          {readout}
        </div>
      )}
      <div
        className={cx(
          "flex w-full overflow-hidden rounded-full bg-surface-2",
          trackH,
        )}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(Math.min(ariaValue, max))}
        aria-label={`Range ${readout}`}
      >
        {powertrain === "BEV" && (
          <div
            className="h-full bg-pt-bev"
            style={{ width: filled ? pct(electric) : "0%", transition }}
          />
        )}
        {powertrain === "HEV" && (
          <div
            className="h-full bg-pt-hev"
            style={{ width: filled ? pct(total) : "0%", transition }}
          />
        )}
        {powertrain === "PHEV" && (
          <>
            <div
              className="h-full bg-pt-phev"
              style={{ width: filled ? `${electricPct}%` : "0%", transition }}
            />
            <div
              className="h-full bg-current"
              style={{
                width: filled ? `${gasPct}%` : "0%",
                transition,
                backgroundImage: GAS_HATCH,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
