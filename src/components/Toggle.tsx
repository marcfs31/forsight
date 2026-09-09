import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent font-sans font-medium text-fg-secondary transition-colors duration-base hover:bg-ink-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus-ring data-[state=on]:border-ink-border data-[state=on]:bg-ink-surface-2 data-[state=on]:text-accent",
  {
    variants: {
      size: {
        sm: "h-8 min-w-8 px-2 text-sm",
        md: "h-10 min-w-10 px-2.5 text-sm",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

export interface ToggleProps
  extends
    React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

/**
 * A single pressed/unpressed control — "show grid lines", "pin sidebar",
 * a toolbar formatting button. For a set of mutually exclusive or
 * independently pressable options, use `ToggleGroup` instead; this is for
 * exactly one on/off toggle standing alone, styled as a button rather
 * than `Switch`'s track-and-thumb (reach for `Switch` when the control
 * reads as a settings row, `Toggle` when it reads as a toolbar action).
 * Renders a native `aria-pressed` button — give it an accessible name via
 * visible text or `aria-label` when it's icon-only.
 */
export const Toggle = React.forwardRef<React.ElementRef<typeof TogglePrimitive.Root>, ToggleProps>(
  ({ className, size, ...props }, ref) => (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(toggleVariants({ size }), className)}
      {...props}
    />
  )
);
Toggle.displayName = "Toggle";
