import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Selected/active state (renders the accent fill). */
  active?: boolean;
}

/** A toggleable filter pill — feels like flipping a switch on the control panel. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ active = false, className, type, children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      aria-pressed={active}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-13 font-medium",
        "transition-colors duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage focus-visible:ring-offset-2",
        active
          ? "border-voltage bg-voltage text-white"
          : "border-line bg-surface text-ink-soft hover:bg-surface-2 hover:text-ink",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  ),
);
Chip.displayName = "Chip";
