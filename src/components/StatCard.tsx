import * as React from "react";
import { cn } from "../lib/cn";
import { Card } from "./Card";
import { Delta } from "./Delta";
import { Sparkline, type SparklineProps } from "./Sparkline";
import { StatusDot, type ServiceStatus } from "./StatusDot";

export interface StatCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** What the number measures, e.g. "p95 latency". */
  label: string;
  /** The headline reading, already formatted — the caller owns units and precision. */
  value: string;
  /** Small unit shown after the value, e.g. "ms", "req/s". */
  unit?: string;
  /** Period-over-period change, in percent. Omit when there is nothing to compare against. */
  delta?: number;
  /** Which direction is good for this metric — see `Delta`. */
  deltaGoodDirection?: "up" | "down" | "none";
  /** What the delta is measured against, e.g. "vs. previous 24h". */
  deltaCaption?: string;
  /** Recent samples, drawn as a `Sparkline` under the value. */
  trend?: number[];
  /** Sparkline tone. Defaults to accent; use a semantic tone for a metric that is currently alerting. */
  trendTone?: SparklineProps["tone"];
  /** Health of the underlying service, shown as a dot beside the label. */
  status?: ServiceStatus;
  /** Wording for the status dot. Defaults to the status name. */
  statusLabel?: string;
}

/**
 * The unit a dashboard is built from: one metric, its current value, how it has
 * moved, and the shape it moved in.
 *
 * Reach for this before a chart. A single number a reader can name beats a plot
 * they have to interpret, and a row of these across the top of a dashboard is
 * usually the highest-value thing on the page. Add `trend` when the shape
 * matters (a spike that already recovered reads very differently from a climb),
 * and `status` when the number should be read alongside whether the service is
 * actually healthy.
 */
export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      label,
      value,
      unit,
      delta,
      deltaGoodDirection = "up",
      deltaCaption,
      trend,
      trendTone,
      status,
      statusLabel,
      ...props
    },
    ref
  ) => (
    <Card ref={ref} className={cn("flex min-w-0 flex-col gap-2 p-4", className)} {...props}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-sans text-fg-secondary">{label}</p>
        {status ? (
          <StatusDot status={status} label={statusLabel ?? null} className="shrink-0" />
        ) : null}
      </div>

      <p className="flex items-baseline gap-1.5 font-heading text-3xl font-semibold text-fg tabular-nums">
        <span className="min-w-0 break-words">{value}</span>
        {unit ? <span className="text-base font-normal text-fg-muted">{unit}</span> : null}
      </p>

      {delta === undefined && deltaCaption === undefined ? null : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {delta === undefined ? null : <Delta value={delta} goodDirection={deltaGoodDirection} />}
          {deltaCaption ? (
            <span className="text-xs font-sans text-fg-muted">{deltaCaption}</span>
          ) : null}
        </div>
      )}

      {trend && trend.length > 0 ? (
        <Sparkline
          className="mt-1"
          values={trend}
          tone={trendTone}
          height={32}
          label={`${label} trend`}
        />
      ) : null}
    </Card>
  )
);
StatCard.displayName = "StatCard";
