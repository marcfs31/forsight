import * as React from "react";
import { clamp } from "./chart";

/**
 * Width of the element `ref` is attached to, so a chart can draw its marks and
 * labels at real pixel sizes instead of scaling an SVG viewBox (which shrinks
 * axis text along with the plot and makes it unreadable at 320px).
 *
 * `fallback` is used until the element has been measured — server render, the
 * first client paint, and any environment without `ResizeObserver` (jsdom).
 */
export function useMeasuredWidth<T extends HTMLElement>(
  fallback: number
): [ref: (node: T | null) => void, width: number] {
  const [width, setWidth] = React.useState(fallback);
  const observerRef = React.useRef<ResizeObserver | null>(null);

  // A callback ref, not useRef + useEffect: it observes the node the moment it
  // is attached and disconnects when it is detached, which also keeps the hook
  // free of the RefObject nullability differences between React 18 and 19.
  const ref = React.useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width ?? 0;
      // A hidden element measures 0; keeping the last known width avoids a
      // chart collapsing to an undrawable geometry while it is display:none.
      if (measured > 0) setWidth(measured);
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return [ref, width];
}

export interface ChartCursor {
  /** Index of the highlighted data slot, or `null` when nothing is hovered/focused. */
  active: number | null;
  setActive: (index: number | null) => void;
  /** Attach to the focusable plot wrapper — Arrow/Home/End move the cursor, Esc clears it. */
  onKeyDown: (event: React.KeyboardEvent) => void;
  onBlur: () => void;
}

/**
 * Keyboard + pointer cursor shared by the plotted charts, so the hover layer a
 * mouse user gets is reachable with a keyboard too (WCAG 2.1.1) and dismissible
 * with Escape (WCAG 1.4.13).
 */
export function useChartCursor(count: number): ChartCursor {
  const [active, setActive] = React.useState<number | null>(null);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (count === 0) return;
      const step = (delta: number) => {
        event.preventDefault();
        setActive((current) => {
          // Entering the plot lands on the near end rather than skipping the
          // first point: ArrowRight starts at the beginning, ArrowLeft at the end.
          if (current === null) return delta > 0 ? 0 : count - 1;
          return clamp(current + delta, 0, count - 1);
        });
      };
      switch (event.key) {
        case "ArrowRight":
          return step(1);
        case "ArrowLeft":
          return step(-1);
        case "Home":
          event.preventDefault();
          return setActive(0);
        case "End":
          event.preventDefault();
          return setActive(count - 1);
        case "Escape":
          return setActive(null);
        default:
          return;
      }
    },
    [count]
  );

  const onBlur = React.useCallback(() => setActive(null), []);

  return { active, setActive, onKeyDown, onBlur };
}
