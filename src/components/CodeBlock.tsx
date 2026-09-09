import * as React from "react";
import { cn } from "../lib/cn";
import { CopyButton } from "./CopyButton";

export interface CodeBlockProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The text shown — a command, a config snippet, a curl example. */
  code: string;
  /** Shown above the code, e.g. a filename or command context. */
  label?: string;
  /** Shows a `CopyButton` for `code`. Default `true`. */
  showCopy?: boolean;
  /** Wrap long lines instead of scrolling horizontally. Default `false`. */
  wrap?: boolean;
}

/**
 * Monospace code/config snippet — a curl example, a config file, a
 * terminal command block. Plain text only, no syntax highlighting (that
 * would need a highlighting dependency this repo doesn't carry); reach
 * for `JSONViewer` instead when the content is actual structured data a
 * reader might want to collapse/inspect rather than copy whole.
 */
export const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  ({ className, code, label, showCopy = true, wrap = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-md border border-ink-border bg-ink-bg",
        className
      )}
      {...props}
    >
      {(label || showCopy) && (
        <div className="flex items-center justify-between gap-2 border-b border-ink-border px-3 py-1.5">
          {label ? (
            <span className="min-w-0 truncate font-mono text-xs text-fg-muted">{label}</span>
          ) : (
            <span />
          )}
          {showCopy && <CopyButton value={code} label="Copy code" />}
        </div>
      )}
      <pre
        className={cn(
          "overflow-x-auto p-3 font-mono text-xs text-fg",
          wrap && "whitespace-pre-wrap break-words"
        )}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
);
CodeBlock.displayName = "CodeBlock";
