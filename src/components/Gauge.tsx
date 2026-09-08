import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { arcPath, clamp, formatCompact, polar } from "../lib/chart";

const gaugeVariants = cva("", {
  variants: {
    tone: {
      accent: "fill-accent",
      success: "fill-success",
      warning: "fill-warning",
      danger: "fill-danger",
    },
  },
  defaultVariants: {
    tone: "accent",
  },
});

export interface GaugeProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof gaugeVariants> {
  /** What is being measured, e.g. "Error budget remaining". */
  label: string;
  value: number;
  min?: number;
  max?: number;
  /** Optional target/SLO marker drawn on the dial, e.g. the 99.9% line. */
  target?: number;
  /** Unit or caption under the number, e.g. "of 30-day budget". */
  caption?: string;
  /** Diameter in CSS pixels. */
  size?: number;
  /** Formats the center number. Defaults to compact notation. */
  valueFormat?: (value: number) => string;
}

/** Sweep of the dial: a 270° arc, opening at the bottom. */
const START_ANGLE = -135;
const SWEEP = 270;

/**
 * Single-value dial for a bounded metric — error budget, disk usage, SLO
 * attainment, queue saturation. Use it when the value has a real ceiling the
 * reader cares about; for an unbounded metric (requests per second), a
 * `StatCard` with a sparkline says more.
 *
 * `tone` is the caller's judgement of the reading, not an automatic threshold:
 * pass `success`/`warning`/`danger` from your own alerting thresholds so the
 * dial agrees with the alert that fired. The color is never the only signal —
 * the number and its caption are always printed.
 *
 * Exposed as an ARIA `meter`, so assistive tech announces value, min and max
 * without a data table.
 */
export const Gauge = React.forwardRef<HTMLDivElement, GaugeProps>(
  (
    {
      className,
      label,
      value,
      min = 0,
      max = 100,
      target,
      caption,
      tone,
      size = 160,
      valueFormat = formatCompact,
      ...props
    },
    ref
  ) => {
    const span = max - min || 1;
    const ratio = clamp((value - min) / span, 0, 1);
    const cx = size / 2;
    const cy = size / 2;
    const outer = size / 2 - 2;
    const inner = outer * 0.74;

    return (
      <div
        ref={ref}
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={`${valueFormat(value)}${caption ? ` ${caption}` : ""}`}
        className={cn("inline-flex flex-col items-center gap-1", className)}
        {...props}
      >
        <svg
          aria-hidden="true"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block max-w-full"
        >
          <path
            d={arcPath(cx, cy, outer, inner, START_ANGLE, START_ANGLE + SWEEP)}
            className="fill-ink-surface-2"
          />
          {ratio > 0 ? (
            <path
              d={arcPath(cx, cy, outer, inner, START_ANGLE, START_ANGLE + SWEEP * ratio)}
              className={gaugeVariants({ tone })}
            />
          ) : null}
          {target === undefined ? null : (
            <line
              {...targetLine(
                cx,
                cy,
                inner,
                outer,
                START_ANGLE + SWEEP * clamp((target - min) / span, 0, 1)
              )}
              className="stroke-fg"
              strokeWidth={2}
            />
          )}
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-fg text-2xl font-semibold font-heading"
          >
            {valueFormat(value)}
          </text>
        </svg>
        <p className="max-w-full text-center text-sm font-medium font-sans text-fg">{label}</p>
        {caption ? (
          <p className="max-w-full text-center text-xs font-sans text-fg-muted">{caption}</p>
        ) : null}
      </div>
    );
  }
);
Gauge.displayName = "Gauge";

/** Endpoints of the target tick, drawn across the ring's thickness. */
function targetLine(cx: number, cy: number, inner: number, outer: number, angle: number) {
  const [x1, y1] = polar(cx, cy, inner, angle);
  const [x2, y2] = polar(cx, cy, outer, angle);
  return { x1, y1, x2, y2 };
}
