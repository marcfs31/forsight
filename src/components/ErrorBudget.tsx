import * as React from "react";
import { cn } from "../lib/cn";
import { Badge } from "./Badge";

export type ErrorBudgetStatus = "healthy" | "at-risk" | "critical";

const STATUS_META: Record<
  ErrorBudgetStatus,
  { label: string; badge: "success" | "warning" | "danger"; fill: string }
> = {
  healthy: { label: "Healthy", badge: "success", fill: "bg-success" },
  "at-risk": { label: "At risk", badge: "warning", fill: "bg-warning" },
  critical: { label: "Critical", badge: "danger", fill: "bg-danger" },
};

export interface ErrorBudgetProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** What the budget covers, e.g. "30-day error budget, checkout-api". */
  label: string;
  /** Percentage of the budget already spent, 0-100. */
  consumed: number;
  /** Caption under the bar, e.g. "Resets in 12 days". */
  caption?: string;
  /** `consumed` at or above which the status becomes `"at-risk"`. Default 70. */
  warningAt?: number;
  /** `consumed` at or above which the status becomes `"critical"`. Default 90. */
  dangerAt?: number;
}

/**
 * SLO burn-down: how much of an error budget is spent, read at a glance as
 * "how much is left" rather than a bounded value like `Gauge` — reach for
 * this specifically for the consumed/remaining budget framing; `Gauge`
 * stays the right choice for a bounded metric with a caller-judged `tone`
 * (disk usage, queue saturation). Unlike `Gauge`, the status here isn't the
 * caller's call: `warningAt`/`dangerAt` derive it from how much budget is
 * left, because "72% of your error budget is gone" means roughly the same
 * thing in any context. The status word is always printed next to the bar
 * (`Badge`), never carried by color alone.
 *
 * Exposed as an ARIA `meter`, so assistive tech announces the consumed
 * value, its bounds, and the status without needing the visual bar.
 */
export const ErrorBudget = React.forwardRef<HTMLDivElement, ErrorBudgetProps>(
  ({ className, label, consumed, caption, warningAt = 70, dangerAt = 90, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, consumed));
    const remaining = Math.round((100 - clamped) * 10) / 10;
    const status: ErrorBudgetStatus =
      clamped >= dangerAt ? "critical" : clamped >= warningAt ? "at-risk" : "healthy";
    const meta = STATUS_META[status];

    return (
      <div
        ref={ref}
        role="meter"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${clamped}% consumed, ${meta.label.toLowerCase()}${caption ? `, ${caption}` : ""}`}
        className={cn("flex w-full min-w-0 flex-col gap-2", className)}
        {...props}
      >
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-sans text-fg-secondary">{label}</p>
          <Badge variant={meta.badge}>{meta.label}</Badge>
        </div>
        <p className="font-heading text-2xl font-semibold text-fg">
          {remaining}% <span className="text-base font-normal text-fg-muted">remaining</span>
        </p>
        <div className="h-3 w-full overflow-hidden rounded-full bg-ink-surface-2">
          <div
            className={cn("h-full rounded-full transition-[width] duration-base", meta.fill)}
            style={{ width: `${clamped}%` }}
          />
        </div>
        {caption ? <p className="text-xs font-sans text-fg-muted">{caption}</p> : null}
      </div>
    );
  }
);
ErrorBudget.displayName = "ErrorBudget";
