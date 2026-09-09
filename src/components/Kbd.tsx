import * as React from "react";
import { cn } from "../lib/cn";

export type KbdProps = React.HTMLAttributes<HTMLElement>;

/**
 * A single keyboard key or shortcut token (`⌘`, `K`, `Esc`), rendered as a
 * native `<kbd>` — purely informational, not interactive, so it carries no
 * touch-target requirement. For a multi-key shortcut, compose several side
 * by side: `<span className="inline-flex items-center gap-1"><Kbd>⌘</Kbd>
 * <Kbd>K</Kbd></span>`. Commonly placed inside a `CommandItem` or a
 * `Tooltip` to hint at a shortcut.
 */
export const Kbd = React.forwardRef<HTMLElement, KbdProps>(({ className, ...props }, ref) => (
  <kbd
    ref={ref}
    className={cn(
      "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-sm border border-ink-border bg-ink-surface-2 px-1 font-mono text-xs font-medium text-fg-secondary",
      className
    )}
    {...props}
  />
));
Kbd.displayName = "Kbd";
