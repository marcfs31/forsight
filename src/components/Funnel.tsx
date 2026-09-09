import * as React from "react";
import { cn } from "../lib/cn";
import { clamp, formatCompact, formatPercent } from "../lib/chart";

export interface FunnelStage {
  /** e.g. "Signed up", "Activated", "Paid". */
  label: string;
  value: number;
}

export interface FunnelProps extends Omit<React.HTMLAttributes<HTMLOListElement>, "children"> {
  /** Ordered top-to-bottom; the first stage is the funnel's 100% baseline. */
  stages: FunnelStage[];
  /** Formats the value printed at the end of each row. Defaults to compact notation. */
  valueFormat?: (value: number) => string;
}

/**
 * Conversion/pipeline stage visualization — bars narrowing stage by stage
 * (signups → activated → paid, or a request pipeline's drop-off at each
 * hop). Each bar is scaled against the *first* stage, so the narrowing
 * itself reads as overall conversion; the percentage printed on every stage
 * after the first is instead the *step* conversion (this stage over the one
 * right before it) — the number a reader actually wants when hunting for
 * where the funnel leaks. For an unordered ranked list with no
 * stage-to-stage relationship, use `BarList` instead.
 */
export const Funnel = React.forwardRef<HTMLOListElement, FunnelProps>(
  ({ className, stages, valueFormat = formatCompact, ...props }, ref) => {
    const first = stages[0]?.value ?? 0;

    return (
      <ol ref={ref} className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props}>
        {stages.map((stage, index) => {
          const shareOfFirst = first > 0 ? clamp((stage.value / first) * 100, 0, 100) : 0;
          const previous = stages[index - 1];
          const stepConversion =
            index > 0 && previous && previous.value > 0
              ? clamp((stage.value / previous.value) * 100, 0, 100)
              : undefined;

          return (
            <li key={stage.label} className="min-w-0">
              <div className="relative flex min-h-9 w-full items-center gap-3 overflow-hidden rounded-sm px-2 text-sm font-sans">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 start-0 rounded-sm bg-accent opacity-25"
                  style={{ width: `${shareOfFirst}%` }}
                />
                <span className="relative min-w-0 flex-1 truncate text-fg">{stage.label}</span>
                {stepConversion !== undefined ? (
                  <span className="relative shrink-0 font-mono text-xs text-fg-muted">
                    <span className="sr-only">Conversion from previous stage: </span>
                    {formatPercent(stepConversion, 0)}
                  </span>
                ) : null}
                <span className="relative shrink-0 font-mono text-fg-secondary">
                  {valueFormat(stage.value)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
);
Funnel.displayName = "Funnel";
