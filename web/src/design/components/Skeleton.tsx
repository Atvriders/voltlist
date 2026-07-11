import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

/**
 * Loading placeholder. Pulses via Tailwind `animate-pulse`, which is disabled
 * automatically under `prefers-reduced-motion: reduce` (see the utility below).
 */
export function Skeleton({
  width,
  height,
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "motion-safe:animate-pulse rounded-control bg-surface-2",
        className,
      )}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
}
