import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cx } from "../../lib/cx";

export function Table({
  className,
  ...rest
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cx("w-full border-collapse text-sm", className)}
        {...rest}
      />
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function Tr({
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cx("border-b border-line", className)} {...rest} />;
}

export function Th({
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cx(
        "eyebrow px-3 py-2 text-left font-medium text-ink-soft",
        className,
      )}
      {...rest}
    />
  );
}

export function Td({
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cx("px-3 py-2 align-top text-ink", className)}
      {...rest}
    />
  );
}
