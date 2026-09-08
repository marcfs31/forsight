import * as React from "react";
import { cn } from "../lib/cn";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Decorative illustration or icon — rendered `aria-hidden`, since `title`/`description` already carry the meaning. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Typically a `Button` ("Create your first X", "Clear filters"). */
  action?: React.ReactNode;
}

/**
 * Placeholder content for a table, list, or search result that has nothing
 * to show — "no deployments yet", "no results match your filters". Renders
 * `role="status"` by default (override via the `role` prop) so a screen
 * reader user is told the section resolved to empty, the same way a
 * loading skeleton resolving to real rows would be discovered by re-reading
 * the section; for a per-keystroke filter result (e.g. inside `Combobox`),
 * prefer `CommandEmpty` instead — its `role="presentation"` avoids
 * over-announcing on every keystroke.
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn("flex flex-col items-center gap-3 px-4 py-12 text-center", className)}
      {...props}
    >
      {icon && (
        <div aria-hidden="true" className="text-fg-muted [&_svg]:h-10 [&_svg]:w-10">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="font-heading text-base font-semibold text-fg">{title}</p>
        {description && <p className="max-w-sm text-sm text-fg-secondary">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
);
EmptyState.displayName = "EmptyState";
