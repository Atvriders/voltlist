import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...rest }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(
        "h-10 w-full rounded-control border bg-surface px-3 text-sm text-ink",
        "placeholder:text-ink-soft",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage",
        invalid ? "border-warn" : "border-line",
        className,
      )}
      {...rest}
    />
  ),
);
Input.displayName = "Input";
