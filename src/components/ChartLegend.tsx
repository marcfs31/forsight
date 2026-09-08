import * as React from "react";
import { cn } from "../lib/cn";
import { seriesBg } from "../lib/chart";

export interface ChartLegendItem {
  /** Series name, as it appears in the plot's data table. */
  label: string;
  /** Categorical slot the series is drawn with. Omit for a neutral swatch. */
  seriesIndex?: number;
  /** Optional value shown after the name — the last reading, a total, a share. */
  value?: string;
}

export interface ChartLegendProps extends React.HTMLAttributes<HTMLUListElement> {
  items: ChartLegendItem[];
}

/**
 * Series key for a chart. Rendered automatically by the multi-series charts;
 * export it for custom plots built on `ChartFrame`.
 *
 * A legend is mandatory whenever a plot shows two or more series — it is what
 * keeps identity from resting on color alone. Labels wear text tokens, never
 * the series color: the swatch beside them carries the identity.
 */
export const ChartLegend = React.forwardRef<HTMLUListElement, ChartLegendProps>(
  ({ className, items, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-sans", className)}
      {...props}
    >
      {items.map((item) => (
        <li key={item.label} className="flex min-w-0 items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn(
              "h-2.5 w-2.5 shrink-0 rounded-sm",
              item.seriesIndex === undefined ? "bg-fg-muted" : seriesBg(item.seriesIndex)
            )}
          />
          <span className="truncate text-fg-secondary">{item.label}</span>
          {item.value === undefined ? null : (
            <span className="shrink-0 font-mono text-fg-muted">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  )
);
ChartLegend.displayName = "ChartLegend";
