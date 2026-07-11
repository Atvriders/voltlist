import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-voltage text-white hover:bg-voltage-ink active:bg-voltage-ink border border-transparent",
  secondary:
    "bg-surface text-ink border border-line hover:bg-surface-2",
  ghost:
    "bg-transparent text-ink border border-transparent hover:bg-surface-2",
  danger:
    "bg-warn text-white border border-transparent hover:opacity-90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-13",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, type, ...rest }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-control font-body font-medium",
        "transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-voltage focus-visible:ring-offset-2",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
