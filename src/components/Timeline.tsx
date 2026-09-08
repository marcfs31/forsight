import * as React from "react";
import { cn } from "../lib/cn";

export type TimelineTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface TimelineItem {
  id: string;
  /** Pre-formatted time or relative age, e.g. "14:02" or "6 min ago". */
  time: string;
  title: string;
  description?: React.ReactNode;
  /** Severity of the event. Neutral by default. */
  tone?: TimelineTone;
}

export interface TimelineProps extends Omit<React.HTMLAttributes<HTMLOListElement>, "children"> {
  items: TimelineItem[];
}

const MARKER_TONES: Record<TimelineTone, string> = {
  neutral: "bg-ink-surface-2 border-ink-border",
  accent: "bg-accent border-accent",
  success: "bg-success border-success",
  warning: "bg-warning border-warning",
  danger: "bg-danger border-danger",
};

/**
 * Ordered event log with a connector rail — incident timelines, deploy history,
 * alert lifecycles, audit trails.
 *
 * Order is meaning here, so it renders an `<ol>`: assistive tech announces
 * position and count, and the visual rail is decorative. Newest-first or
 * oldest-first is the caller's call; say which one in the surrounding heading,
 * because the component can't.
 */
export const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(
  ({ className, items, ...props }, ref) => (
    <ol ref={ref} className={cn("flex w-full min-w-0 flex-col", className)} {...props}>
      {items.map((item, index) => (
        <li key={item.id} className="flex min-w-0 gap-3">
          <div aria-hidden="true" className="flex w-3 shrink-0 flex-col items-center">
            <span
              className={cn(
                "mt-1.5 h-3 w-3 shrink-0 rounded-full border",
                MARKER_TONES[item.tone ?? "neutral"]
              )}
            />
            {index < items.length - 1 ? <span className="w-px flex-1 bg-ink-border" /> : null}
          </div>
          <div className={cn("min-w-0 flex-1", index < items.length - 1 && "pb-4")}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="min-w-0 text-sm font-medium font-sans text-fg">{item.title}</p>
              <time className="shrink-0 font-mono text-xs text-fg-muted">{item.time}</time>
            </div>
            {item.description ? (
              <div className="mt-0.5 text-sm font-sans text-fg-secondary">{item.description}</div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
);
Timeline.displayName = "Timeline";
