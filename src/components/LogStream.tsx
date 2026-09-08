import * as React from "react";
import { cn } from "../lib/cn";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  id: string;
  /** Pre-formatted timestamp — the caller owns the timezone and precision. */
  timestamp: string;
  level: LogLevel;
  message: string;
  /** Emitting service, pod or logger name. */
  source?: string;
}

export interface LogStreamProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** What is being streamed, e.g. "checkout-api production logs". */
  label: string;
  entries: LogEntry[];
  /** Scroll ceiling in CSS pixels. */
  maxHeight?: number;
  /**
   * Announce new lines as they arrive. Off by default: a busy stream read aloud
   * continuously is unusable — turn it on only for a low-volume, high-value feed
   * such as a deploy log the user is waiting on.
   */
  announce?: boolean;
}

const LEVEL_TONES: Record<LogLevel, string> = {
  debug: "bg-ink-surface-2 text-fg-muted",
  info: "bg-ink-surface-2 text-fg-secondary",
  warn: "bg-warning-subtle text-warning",
  error: "bg-danger-subtle text-danger",
  fatal: "bg-danger text-danger-fg",
};

const LEVEL_ORDER: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];

/**
 * Scrollable log viewer with a level chip per line — the "what just happened"
 * pane under a chart, or the body of a log-search result.
 *
 * The level is printed as a word, never as color alone, and lines wrap rather
 * than truncate so a long message is readable without a horizontal scrub. The
 * region is exposed as an ARIA `log`; whether it *announces* is opt-in via
 * `announce`, because a live region attached to a busy stream drowns out
 * everything else on the page.
 */
export const LogStream = React.forwardRef<HTMLDivElement, LogStreamProps>(
  ({ className, label, entries, maxHeight = 320, announce = false, ...props }, ref) => (
    <div
      ref={ref}
      role="log"
      aria-label={label}
      // A scrollable box that can't be reached by keyboard traps its content
      // for anyone not using a mouse (WCAG 2.1.1, axe's
      // scrollable-region-focusable): the region itself is the scroll control.
      tabIndex={0}
      aria-live={announce ? "polite" : "off"}
      aria-relevant="additions"
      style={{ maxHeight }}
      className={cn(
        "w-full min-w-0 overflow-y-auto rounded-md border border-ink-border bg-ink-bg font-mono text-xs focus-visible:outline-none focus-visible:shadow-focus-ring",
        className
      )}
      {...props}
    >
      {entries.length === 0 ? (
        <p className="p-3 text-fg-muted">No log lines in this window.</p>
      ) : (
        <ol className="divide-y divide-ink-border-subtle">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-start gap-x-3 gap-y-1 px-3 py-2 hover:bg-ink-surface"
            >
              <time className="shrink-0 text-fg-muted">{entry.timestamp}</time>
              <span
                className={cn(
                  "shrink-0 rounded-sm px-1.5 py-0.5 text-[0.6875rem] font-medium uppercase",
                  LEVEL_TONES[entry.level]
                )}
              >
                {entry.level}
              </span>
              {entry.source ? (
                <span className="shrink-0 text-fg-secondary">{entry.source}</span>
              ) : null}
              <span className="min-w-0 flex-1 break-words text-fg">{entry.message}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
);
LogStream.displayName = "LogStream";

/** Levels in severity order — for building a filter control over a stream. */
export const LOG_LEVELS = LEVEL_ORDER;
