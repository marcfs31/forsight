import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { cn } from "../lib/cn";
import { POPPER_ANIMATION_CLASSES } from "../lib/animation";

export const HoverCard = HoverCardPrimitive.Root;
export const HoverCardTrigger = HoverCardPrimitive.Trigger;

/**
 * Rich preview shown on hover (or focus — it opens the same way for
 * keyboard users, and dismisses on blur) of something the trigger only
 * partly represents: a user's profile summary behind their avatar, a
 * service's health summary behind its name in a table. Unlike `Tooltip`
 * (a short text hint) this can hold arbitrary content; unlike `Popover`
 * (click-triggered, holds focus) it never traps focus and never becomes
 * the only place to reach information — the trigger itself must still
 * make sense on its own, since touch users get no hover and some
 * keyboard flows tab past too quickly to linger.
 */
export const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 8, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 max-w-[calc(100vw-2rem)] rounded-md border border-ink-border bg-ink-surface p-4 shadow-lg outline-none",
        POPPER_ANIMATION_CLASSES,
        className
      )}
      {...props}
    />
  </HoverCardPrimitive.Portal>
));
HoverCardContent.displayName = "HoverCardContent";
