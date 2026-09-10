import * as React from "react";
import { cn } from "../lib/cn";

export interface CopyButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick"
> {
  /** The text copied to the clipboard. */
  value: string;
  /** Accessible name while idle. */
  label?: string;
  /** Accessible name shown briefly after a successful copy. */
  copiedLabel?: string;
  /** How long the copied state (and its icon) shows before reverting, in ms. */
  resetAfter?: number;
}

const CLIPBOARD_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="4" y="2" width="6" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
    <rect x="2.5" y="3.5" width="9" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const CHECK_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M2.5 7.5L5.5 10.5L11.5 3.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Icon button that copies `value` to the clipboard and briefly confirms it
 * — the accessible name swaps to `copiedLabel` and a polite live region
 * announces it too, so the confirmation reaches assistive tech even though
 * nothing moves focus. Used by `CodeBlock`; also useful standalone next to
 * an API key, a webhook URL, or any single value worth copying whole.
 */
export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    { value, label = "Copy", copiedLabel = "Copied!", resetAfter = 1600, className, ...props },
    ref
  ) => {
    const [copied, setCopied] = React.useState(false);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

    const handleClick = async () => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetAfter);
      } catch {
        // Clipboard access can be denied (permissions, insecure context) —
        // there's nothing more this control can do about it, so it just
        // stays in the un-copied state rather than claiming success.
      }
    };

    return (
      <>
        <button
          ref={ref}
          type="button"
          aria-label={copied ? copiedLabel : label}
          onClick={handleClick}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors duration-base hover:bg-ink-surface-2 hover:text-fg focus-visible:outline-none focus-visible:shadow-focus-ring",
            copied && "text-success",
            className
          )}
          {...props}
        >
          {copied ? CHECK_ICON : CLIPBOARD_ICON}
        </button>
        <span role="status" className="sr-only">
          {copied ? copiedLabel : ""}
        </span>
      </>
    );
  }
);
CopyButton.displayName = "CopyButton";
