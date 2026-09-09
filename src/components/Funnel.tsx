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
                  // `text-fg-secondary`, not the lighter `text-fg-muted` —
                  // this badge can sit on top of the accent overlay bar
                  // above (when `shareOfFirst` is high, the bar reaches all
                  // the way under it), and `fg-muted` doesn't have enough
                  // contrast margin to survive that tint. Caught only by the
                  // Storybook test runner's real-Chromium axe check, at a
                  // high-conversion stage where the bar was wide enough to
                  // reach this far — matches BarList's value text, which
                  // sits in the same overlay zone and uses the same color.
                  <span className="relative shrink-0 font-mono text-xs text-fg-secondary">
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
