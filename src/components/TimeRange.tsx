import * as React from "react";
import { cn } from "../lib/cn";

export interface TimeRangeOption {
  /** Stable value passed back to `onValueChange`, e.g. "1h" or "7d". */
  value: string;
  /** Visible text, e.g. "1h". Keep it short — this is a dense control. */
  label: string;
  /** Longer name for assistive tech, e.g. "Last 1 hour". */
  description?: string;
}

export interface TimeRangeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Names the group, e.g. "Dashboard time range". */
  label: string;
  options: TimeRangeOption[];
  /** Selected option value (controlled). */
  value: string;
  onValueChange: (value: string) => void;
}

/**
 * Segmented window picker that sits above a dashboard — 1h / 6h / 24h / 7d.
 *
 * It is a real ARIA radio group, not a row of buttons: exactly one option is
 * selected, Arrow keys move between options (wrapping, selecting as they go),
 * Home/End jump to the ends, and only the selected option is in the tab order.
 * That is the keyboard model a user already expects from a segmented control.
 *
 * The component is controlled — the time range usually lives in the URL, and
 * every chart on the page has to agree with it.
 */
export const TimeRange = React.forwardRef<HTMLDivElement, TimeRangeProps>(
  ({ className, label, options, value, onValueChange, ...props }, ref) => {
    const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
    const selectedIndex = options.findIndex((option) => option.value === value);

    const moveTo = (index: number) => {
      const next = (index + options.length) % options.length;
      onValueChange(options[next].value);
      itemRefs.current[next]?.focus();
    };

    const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          return moveTo(index + 1);
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          return moveTo(index - 1);
        case "Home":
          event.preventDefault();
          return moveTo(0);
        case "End":
          event.preventDefault();
          return moveTo(options.length - 1);
        default:
          return;
      }
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={label}
        className={cn(
          "inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-md border border-ink-border bg-ink-surface p-0.5",
          className
        )}
        {...props}
      >
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.description}
              // Roving tab stop: the group is one stop, arrows move inside it.
              // With nothing selected yet, the first option takes the stop.
              tabIndex={selected || (selectedIndex === -1 && index === 0) ? 0 : -1}
              onClick={() => onValueChange(option.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "flex min-h-9 min-w-9 items-center justify-center rounded-sm px-2.5 text-sm font-medium font-sans transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus-ring",
                selected
                  ? "bg-accent text-accent-fg"
                  : "text-fg-secondary hover:bg-ink-surface-2 hover:text-fg"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }
);
TimeRange.displayName = "TimeRange";
