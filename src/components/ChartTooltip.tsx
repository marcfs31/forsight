import * as React from "react";
import { cn } from "../lib/cn";
import { seriesBg } from "../lib/chart";

export interface ChartTooltipRow {
  label: string;
  value: string;
  /** Categorical slot, so the row's swatch matches its mark in the plot. */
  seriesIndex?: number;
}

export interface ChartTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The x-position being read — a timestamp, a bucket, a category. */
  title: string;
  rows: ChartTooltipRow[];
}

/**
 * Readout surface for a chart's hover/keyboard cursor. The plotted charts
 * position one for you; export it for custom plots built on `ChartFrame`.
 *
 * It is deliberately `aria-hidden` and pointer-transparent: the same reading is
 * announced by the polite live region the charts render alongside it, and
 * assistive tech gets the full series from the frame's data table — a tooltip
 * that also announced itself would read every value twice.
 */
export const ChartTooltip = React.forwardRef<HTMLDivElement, ChartTooltipProps>(
  ({ className, title, rows, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none w-max max-w-[calc(100vw-2rem)] rounded-md border border-ink-border bg-ink-surface px-2.5 py-2 shadow-md",
        className
      )}
      {...props}
    >
      <p className="mb-1 text-xs font-medium font-sans text-fg">{title}</p>
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-xs font-sans">
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-sm",
                row.seriesIndex === undefined ? "bg-fg-muted" : seriesBg(row.seriesIndex)
              )}
            />
            <span className="me-2 truncate text-fg-secondary">{row.label}</span>
            <span className="ms-auto font-mono text-fg">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
);
ChartTooltip.displayName = "ChartTooltip";
