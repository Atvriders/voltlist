import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "../../lib/cx";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Elements that can hold keyboard focus inside the dialog. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Accessible modal: role=dialog, aria-modal, labelled by its visible heading.
 * Escape + backdrop close, portalled to <body>. On open it captures the
 * triggering element, moves focus into the dialog, traps Tab within it, and
 * restores focus to the trigger on close.
 */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Capture the trigger, move focus into the dialog, and restore it on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current =
      (document.activeElement as HTMLElement | null) ?? null;

    const container = containerRef.current;
    const focusables =
      container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables && focusables.length > 0) {
      focusables[0]?.focus();
    } else {
      container?.focus();
    }

    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Escape to close + Tab focus trap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusables.length === 0) {
        // Nothing focusable inside — keep focus pinned to the container.
        e.preventDefault();
        container.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const outside = active == null || !container.contains(active);

      if (e.shiftKey) {
        if (active === first || active === container || outside) {
          e.preventDefault();
          last?.focus();
        }
      } else if (active === last || outside) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title != null ? titleId : undefined}
        tabIndex={-1}
        className={cx(
          "w-full max-w-lg rounded-card border border-line bg-surface p-6 shadow-lift focus:outline-none",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title != null && (
          <h2 id={titleId} className="mb-4 font-display text-xl text-ink">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
