import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { Spinner } from "./Spinner";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans font-medium transition-colors duration-base disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus-ring",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active",
        secondary:
          "bg-ink-surface-2 text-fg border border-ink-border hover:border-accent hover:text-accent",
        spark: "bg-spark text-spark-fg hover:bg-spark-hover",
        ghost: "bg-transparent text-fg-secondary hover:bg-ink-surface-2 hover:text-fg",
        danger: "bg-danger text-danger-fg hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Icon or spinner rendered before the label. Ignored while `loading` (a Spinner takes its place). */
  leadingIcon?: React.ReactNode;
  /** Shows a spinner in place of `leadingIcon` and disables the button — for an in-flight async action. */
  loading?: boolean;
}

/**
 * Forsight primary interactive control. Use `primary` for the single most
 * important action on a screen, `secondary` for supporting actions,
 * `spark` to draw extra attention (upsell, promo), `ghost` for low-emphasis
 * toolbar actions, and `danger` for destructive confirmations. Set `loading`
 * for an in-flight async action instead of manually swapping in a Spinner —
 * it also disables the button so it can't be double-submitted.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, leadingIcon, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? <Spinner size="sm" aria-hidden="true" /> : leadingIcon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
