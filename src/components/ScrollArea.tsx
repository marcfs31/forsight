import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "../lib/cn";

export interface ScrollAreaProps extends React.ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.Root
> {
  /** Which scrollbar(s) to render a custom track/thumb for. Defaults to vertical only. */
  orientation?: "vertical" | "horizontal" | "both";
}

/**
 * Custom-styled scrollbar for a fixed-size panel (a side nav, a long
 * dropdown, a code pane) — this repo's other scrollable surfaces (`Sidebar`,
 * `LogStream`, `Command`) rely on the browser's native scrollbar instead;
 * reach for this one specifically when a consuming app wants a thinner,
 * token-colored bar rather than the OS default. Wraps
 * `@radix-ui/react-scroll-area`, which keeps real native scrolling (wheel,
 * touch, keyboard, momentum) and only re-skins the visual thumb/track —
 * nothing here changes how scrolling itself behaves.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        // Radix's native viewport is the thing that actually scrolls, but a
        // plain `overflow: scroll` div isn't in the tab order by default —
        // without a `tabIndex`, keyboard users have no way to reach it and
        // scroll via arrow keys (axe's `scrollable-region-focusable`, a real
        // WCAG 2.1.1 failure caught only by the real-Chromium test runner,
        // not jsdom).
        tabIndex={0}
        className="h-full w-full rounded-[inherit] focus-visible:outline-none focus-visible:shadow-focus-ring"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {(orientation === "vertical" || orientation === "both") && (
        <ScrollBar orientation="vertical" />
      )}
      {(orientation === "horizontal" || orientation === "both") && (
        <ScrollBar orientation="horizontal" />
      )}
      <ScrollAreaPrimitive.Corner className="bg-transparent" />
    </ScrollAreaPrimitive.Root>
  )
);
ScrollArea.displayName = "ScrollArea";

function ScrollBar({ orientation }: { orientation: "vertical" | "horizontal" }) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      orientation={orientation}
      className={cn(
        "flex touch-none select-none p-0.5 transition-colors duration-base",
        // Radix positions the scrollbar itself via `position: absolute` but
        // leaves the edge inset to the consumer — logical `start`/`end`
        // rather than `left`/`right` so it mirrors correctly under RTL.
        orientation === "vertical" && "bottom-0 end-0 top-0 w-2.5",
        orientation === "horizontal" && "start-0 end-0 bottom-0 h-2.5 flex-col"
      )}
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-ink-border transition-colors duration-base hover:bg-fg-muted" />
    </ScrollAreaPrimitive.Scrollbar>
  );
}
