import * as React from "react";
import { cn } from "../lib/cn";
import { formatPercent } from "../lib/chart";
import { STATUS_LABELS, type ServiceStatus } from "./StatusDot";

export interface UptimeSegment {
  /** The period this bar covers, e.g. "12 Mar" or "14:00". */
  label: string;
  status: ServiceStatus;
  /** What happened, for the segment's tooltip and the incident summary. */
  detail?: string;
}

export interface UptimeBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** What the strip covers, e.g. "checkout-api, last 90 days". */
  label: string;
  /** One entry per period, oldest first. */
  segments: UptimeSegment[];
  /** Caption under the strip's start, e.g. "90 days ago". */
  startCaption?: string;
  /** Caption under the strip's end, e.g. "Today". */
  endCaption?: string;
}

const SEGMENT_TONES: Record<ServiceStatus, string> = {
  operational: "bg-success",
  degraded: "bg-warning",
  outage: "bg-danger",
  maintenance: "bg-accent",
  unknown: "bg-ink-surface-2",
};

/**
 * Status-page uptime strip: one thin bar per period, the shape every reader
 * already knows how to scan for "when did this break".
 *
 * The strip itself is decorative to assistive tech — ninety announced bars is
 * noise, not information. What replaces it is the summary line this component
 * renders (uptime percentage over the window) plus a visually hidden list of
 * only the periods that were not healthy, which is the thing a non-visual
 * reader is actually looking for.
 */
export const UptimeBar = React.forwardRef<HTMLDivElement, UptimeBarProps>(
  ({ className, label, segments, startCaption, endCaption, ...props }, ref) => {
    const known = segments.filter((segment) => segment.status !== "unknown");
    const healthy = known.filter((segment) => segment.status === "operational");
    const uptime = known.length > 0 ? (healthy.length / known.length) * 100 : 0;
    const incidents = segments.filter(
      (segment) => segment.status === "degraded" || segment.status === "outage"
    );

    return (
      <div ref={ref} className={cn("flex w-full min-w-0 flex-col gap-2", className)} {...props}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="min-w-0 truncate text-sm font-medium font-sans text-fg">{label}</p>
          <p className="shrink-0 font-mono text-sm text-fg-secondary">
            {formatPercent(uptime, 2)} uptime
          </p>
        </div>

        <div aria-hidden="true" className="flex w-full min-w-0 items-stretch gap-0.5">
          {segments.map((segment, index) => (
            <span
              key={`${segment.label}-${index}`}
              title={`${segment.label}: ${STATUS_LABELS[segment.status]}${
                segment.detail ? ` — ${segment.detail}` : ""
              }`}
              className={cn(
                "h-8 min-w-0 flex-1 rounded-sm transition-opacity duration-fast hover:opacity-70",
                SEGMENT_TONES[segment.status]
              )}
            />
          ))}
        </div>

        {startCaption || endCaption ? (
          <div className="flex items-center justify-between text-xs font-sans text-fg-muted">
            <span>{startCaption}</span>
            <span>{endCaption}</span>
          </div>
        ) : null}

        <div className="sr-only">
          <p>{`${label}: ${formatPercent(uptime, 2)} uptime over ${segments.length} periods.`}</p>
          {incidents.length === 0 ? (
            <p>No degraded or failing periods.</p>
          ) : (
            <ul>
              {incidents.map((segment, index) => (
                <li key={`${segment.label}-${index}`}>
                  {`${segment.label}: ${STATUS_LABELS[segment.status]}${
                    segment.detail ? `, ${segment.detail}` : ""
                  }`}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
);
UptimeBar.displayName = "UptimeBar";
