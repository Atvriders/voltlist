import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...rest }, ref) => (
    <select
      ref={ref}
      className={cx(
        "h-10 w-full appearance-none rounded-control border border-line bg-surface px-3 pr-8 text-sm text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage",
        // Chevron, drawn with the ink-soft token via an inline data-URI SVG.
        "bg-[right_0.5rem_center] bg-no-repeat",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5 6 7.5 9 4.5' stroke='%23566068' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
