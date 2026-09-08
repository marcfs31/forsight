import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export type ServiceStatus = "operational" | "degraded" | "outage" | "maintenance" | "unknown";

const dotVariants = cva("inline-block h-2.5 w-2.5 shrink-0 rounded-full", {
  variants: {
    status: {
      operational: "bg-success",
      degraded: "bg-warning",
      outage: "bg-danger",
      maintenance: "bg-accent",
      unknown: "bg-fg-muted",
    },
  },
  defaultVariants: {
    status: "unknown",
  },
});

/** Default wording, used when the caller doesn't pass its own label. */
export const STATUS_LABELS: Record<ServiceStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  outage: "Outage",
  maintenance: "Maintenance",
  unknown: "Unknown",
};

export interface StatusDotProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof dotVariants> {
  status: ServiceStatus;
  /** Visible wording. Defaults to the status name; pass `null` to show the dot alone. */
  label?: React.ReactNode;
  /** Animate the dot — reserve it for a live "happening right now" state. */
  pulse?: boolean;
}

/**
 * Health indicator for a service, host, check or environment.
 *
 * The status word is rendered next to the dot by default, because a colored
 * circle on its own is unreadable to a colorblind or screen-reader user. If
 * your layout genuinely can't fit the word (a dense table cell), pass
 * `label={null}` — the status name is still announced from a visually hidden
 * span, so the meaning survives.
 *
 * `pulse` is decorative and disappears under `prefers-reduced-motion`.
 */
export const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ className, status, label, pulse = false, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("inline-flex items-center gap-2 text-sm font-sans text-fg", className)}
      {...props}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        {pulse ? (
          <span
            aria-hidden="true"
            className={cn(
              dotVariants({ status }),
              "absolute inset-0 animate-ping opacity-60 motion-reduce:hidden"
            )}
          />
        ) : null}
        <span aria-hidden="true" className={cn(dotVariants({ status }), "relative")} />
      </span>
      {label === null ? (
        <span className="sr-only">{STATUS_LABELS[status]}</span>
      ) : (
        <span className="truncate">{label ?? STATUS_LABELS[status]}</span>
      )}
    </span>
  )
);
StatusDot.displayName = "StatusDot";
