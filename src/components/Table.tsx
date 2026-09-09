import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Styled semantic table parts — no sorting/pagination/virtualization logic
 * of their own. For interactive tables, layer a headless library (e.g.
 * TanStack Table) on top and render its rows/cells through these
 * primitives; `TableHead`'s `sortDirection`/`onSort` props (below) render
 * and announce a sortable column's state without doing the sorting
 * themselves — that decision (and the actual reorder) stays the caller's.
 *
 * On mobile, the table is automatically wrapped in a scrollable container
 * to prevent horizontal overflow.
 */
export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="w-full overflow-x-auto rounded-md border border-ink-border">
    <table
      ref={ref}
      className={cn("w-full border-collapse font-sans text-sm", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-ink-surface-2", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => <tbody ref={ref} className={cn(className)} {...props} />);
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-ink-border last:border-0 transition-colors duration-base hover:bg-ink-surface-2",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * Makes this a sortable column: sets `aria-sort` and renders `children`
   * inside a button with a direction indicator, instead of plain text. Pass
   * `onSort` alongside it — this component only renders the control and
   * announces its state; it never sorts rows itself (per this file's own
   * "no sorting logic" scope note). Omit both props for a plain header.
   */
  sortDirection?: "ascending" | "descending" | "none";
  /** Fires when the header is activated (click, or Enter/Space on the button). */
  onSort?: () => void;
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, scope = "col", sortDirection, onSort, children, ...props }, ref) => (
    <th
      ref={ref}
      scope={scope}
      aria-sort={sortDirection}
      className={cn(
        "px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-fg-muted",
        className
      )}
      {...props}
    >
      {sortDirection !== undefined ? (
        <button
          type="button"
          onClick={onSort}
          className="-m-1 inline-flex items-center gap-1 rounded-sm p-1 uppercase tracking-wide text-fg-muted transition-colors duration-fast hover:text-fg focus-visible:outline-none focus-visible:shadow-focus-ring"
        >
          {children}
          <SortIcon direction={sortDirection} />
        </button>
      ) : (
        children
      )}
    </th>
  )
);
TableHead.displayName = "TableHead";

function SortIcon({ direction }: { direction: "ascending" | "descending" | "none" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 shrink-0 fill-current">
      <path d="M6 1.5 9 5.5H3z" className={direction === "ascending" ? "" : "opacity-30"} />
      <path d="M6 10.5 3 6.5h6z" className={direction === "descending" ? "" : "opacity-30"} />
    </svg>
  );
}

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("px-4 py-2.5 text-fg", className)} {...props} />
));
TableCell.displayName = "TableCell";
