import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/**
 * Segmented set of pressed-button options — view-mode switches ("Table" /
 * "Chart"), chart-type toggles, density controls. `type="single"` (the
 * common case) renders as `role="radiogroup"` of `role="radio"` items —
 * the same roles as `RadioGroup`, just styled as a connected button row
 * instead of radio dots. Arrow/Home/End move a roving focus between items
 * (unlike `RadioGroup`, moving focus does not itself change the selection —
 * Space/Enter or a click does). `type="multiple"` renders as
 * `role="toolbar"` of independently pressable (`aria-pressed`) buttons.
 * Always give the group an accessible name via `aria-label` or
 * `aria-labelledby` — same requirement as `RadioGroup`. For a single
 * binary on/off control use `Switch` instead.
 */
export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex flex-wrap items-center gap-1 rounded-md border border-ink-border bg-ink-surface-2 p-1",
      className
    )}
    {...props}
  />
));
ToggleGroup.displayName = "ToggleGroup";

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm font-sans font-medium text-fg-muted transition-colors duration-base hover:text-fg-secondary disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus-ring data-[state=on]:bg-ink-surface data-[state=on]:text-fg data-[state=on]:shadow-sm",
  {
    variants: {
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

export interface ToggleGroupItemProps
  extends
    React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
    VariantProps<typeof toggleGroupItemVariants> {}

export const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, size, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(toggleGroupItemVariants({ size }), className)}
    {...props}
  />
));
ToggleGroupItem.displayName = "ToggleGroupItem";
