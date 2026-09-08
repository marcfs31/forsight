import * as React from "react";
import { cn } from "../lib/cn";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertListItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  description?: React.ReactNode;
  /** Pre-formatted time or relative age, e.g. "14:02" or "6 min ago". */
  time: string;
  /** Emitting service, check or rule name. */
  source?: string;
  /** Marks the alert as resolved — dims the row and appends a "Resolved" badge, without hiding what it was. */
  resolved?: boolean;
}

export interface AlertListProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "children"> {
  /** Accessible name for the list, e.g. "Active alerts". */
  label: string;
  items: AlertListItem[];
  /** Shown via `EmptyState` when `items` is empty. */
  emptyMessage?: React.ReactNode;
  /**
   * Announce new/changed alerts as they arrive. On by default — unlike
   * `LogStream` (a busy, continuous feed where announcing every line would
   * drown out everything else), an alert list is normally low-volume and
   * every item is worth interrupting for; turn it off for a firehose feed.
   */
  announce?: boolean;
}

const SEVERITY_BADGE: Record<
  AlertSeverity,
  { variant: "danger" | "warning" | "accent"; label: string }
> = {
  critical: { variant: "danger", label: "Critical" },
  warning: { variant: "warning", label: "Warning" },
  info: { variant: "accent", label: "Info" },
};

/**
 * "What's firing right now" — active and recently resolved alerts, ranked
 * by recency rather than history. Complements `Timeline` (a full event
 * history) and `StatusDot` (a single point-in-time health read): this is
 * the list a responder scans first. Severity is always printed as a word
 * via `Badge`, never color alone.
 */
export const AlertList = React.forwardRef<HTMLUListElement, AlertListProps>(
  ({ className, label, items, emptyMessage = "No alerts.", announce = true, ...props }, ref) => {
    if (items.length === 0) {
      return <EmptyState title={emptyMessage} className={className} />;
    }

    return (
      <ul
        ref={ref}
        aria-label={label}
        aria-live={announce ? "polite" : "off"}
        aria-relevant="additions"
        className={cn("flex w-full min-w-0 flex-col divide-y divide-ink-border", className)}
        {...props}
      >
        {items.map((item) => {
          const severity = SEVERITY_BADGE[item.severity];
          return (
            <li
              key={item.id}
              className={cn("flex min-w-0 flex-col gap-1 py-3", item.resolved && "opacity-60")}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge variant={severity.variant}>{severity.label}</Badge>
                {item.resolved ? <Badge variant="success">Resolved</Badge> : null}
                <p className="min-w-0 flex-1 truncate text-sm font-medium font-sans text-fg">
                  {item.title}
                </p>
                <time className="shrink-0 font-mono text-xs text-fg-muted">{item.time}</time>
              </div>
              {(item.description || item.source) && (
                <div className="flex flex-wrap items-baseline gap-x-2 text-sm font-sans text-fg-secondary">
                  {item.description}
                  {item.source ? (
                    <span className="shrink-0 text-xs text-fg-muted">{item.source}</span>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }
);
AlertList.displayName = "AlertList";
