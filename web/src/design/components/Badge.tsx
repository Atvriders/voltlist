import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export type BadgeTone =
  | "neutral"
  | "bev"
  | "phev"
  | "hev"
  | "good"
  | "warn"
  | "voltage";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-soft",
  bev: "text-pt-bev bg-[color-mix(in_srgb,var(--pt-bev)_14%,transparent)]",
  phev: "text-pt-phev bg-[color-mix(in_srgb,var(--pt-phev)_14%,transparent)]",
  hev: "text-pt-hev bg-[color-mix(in_srgb,var(--pt-hev)_14%,transparent)]",
  good: "text-good bg-[color-mix(in_srgb,var(--good)_14%,transparent)]",
  warn: "text-warn bg-[color-mix(in_srgb,var(--warn)_14%,transparent)]",
  voltage:
    "text-voltage bg-[color-mix(in_srgb,var(--voltage)_14%,transparent)]",
};

export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-[0.04em]",
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}

/** Map a powertrain type to its Badge tone. */
export function powertrainTone(pt: "BEV" | "PHEV" | "HEV"): BadgeTone {
  return pt === "BEV" ? "bev" : pt === "PHEV" ? "phev" : "hev";
}
