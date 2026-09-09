import * as React from "react";
import { cn } from "../lib/cn";

export interface StepperStep {
  label: string;
  description?: string;
}

export interface StepperProps extends Omit<React.HTMLAttributes<HTMLOListElement>, "children"> {
  /** Accessible name, e.g. "Setup progress". */
  label: string;
  steps: StepperStep[];
  /** 0-based index of the step currently in progress. */
  currentStep: number;
}

const CHECK_ICON = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M2 6.5L4.5 9L10 3"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Multi-step wizard/setup progress — "Account", "Team", "Billing", each
 * marked done, current, or upcoming. The current step is exposed via
 * `aria-current="step"` (the token WAI-ARIA defines for exactly this),
 * not a visual-only highlight, and the whole thing is a real `<ol>` so a
 * screen reader announces the step count and each one's position in it.
 * For a bounded progress percentage instead of discrete named steps, use
 * `Progress`.
 */
export const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(
  ({ className, label, steps, currentStep, ...props }, ref) => (
    <ol
      ref={ref}
      aria-label={label}
      className={cn("flex w-full min-w-0 items-start overflow-x-auto", className)}
      {...props}
    >
      {steps.map((step, index) => {
        const status =
          index < currentStep ? "complete" : index === currentStep ? "current" : "upcoming";
        return (
          <li
            key={step.label}
            aria-current={status === "current" ? "step" : undefined}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5 last:flex-none"
          >
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium font-sans",
                  status === "complete" && "bg-accent text-accent-fg",
                  status === "current" && "border-2 border-accent bg-ink-surface text-accent",
                  status === "upcoming" && "border border-ink-border bg-ink-surface text-fg-muted"
                )}
              >
                {status === "complete" ? CHECK_ICON : index + 1}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mx-2 h-px flex-1",
                    status === "complete" ? "bg-accent" : "bg-ink-border"
                  )}
                />
              )}
            </div>
            <div className="flex max-w-[8rem] flex-col items-center text-center">
              <span
                className={cn(
                  "truncate text-xs font-medium font-sans",
                  status === "upcoming" ? "text-fg-muted" : "text-fg"
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="truncate text-xs text-fg-muted">{step.description}</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  )
);
Stepper.displayName = "Stepper";
