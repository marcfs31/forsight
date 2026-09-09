import * as React from "react";
import { cn } from "../lib/cn";

export interface JSONViewerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Accessible name / visible caption, e.g. "Span attributes". */
  label: string;
  data: unknown;
  /**
   * How many levels of nesting start expanded, below the always-open root.
   * Default 0: the root's own keys are visible, and any of them that are
   * themselves objects/arrays start collapsed.
   */
  defaultDepth?: number;
}

/**
 * Collapsible tree for structured data — log fields, trace/span attributes,
 * request/response payloads. Every node the reader hasn't collapsed is
 * plain, real text content (not a canvas or a virtualized list), so it's
 * as inspectable by a screen reader or Ctrl+F as it is by eye; collapsing a
 * node removes its children from the DOM rather than just hiding them, so
 * assistive tech never lands on content the sighted view has hidden.
 *
 * This is a set of nested disclosure buttons, not a WAI-ARIA `tree` widget
 * (`role="tree"`/roving arrow-key focus) — Tab and Enter/Space are enough
 * to reach and operate every node, which is the interaction model an
 * inspector like this actually needs.
 */
export const JSONViewer = React.forwardRef<HTMLDivElement, JSONViewerProps>(
  ({ className, label, data, defaultDepth = 0, ...props }, ref) => {
    const [expanded, setExpanded] = React.useState(() => defaultExpandedPaths(data, defaultDepth));

    const toggle = React.useCallback((path: string) => {
      setExpanded((current) => {
        const next = new Set(current);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
    }, []);

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className={cn(
          "w-full min-w-0 overflow-x-auto rounded-md border border-ink-border bg-ink-bg p-3 font-mono text-xs",
          className
        )}
        {...props}
      >
        <JSONNode value={data} path="$" expanded={expanded} onToggle={toggle} />
      </div>
    );
  }
);
JSONViewer.displayName = "JSONViewer";

function isExpandable(value: unknown): value is Record<string, unknown> | unknown[] {
  return value !== null && typeof value === "object";
}

function entriesOf(value: Record<string, unknown> | unknown[]): Array<[string, unknown]> {
  return Array.isArray(value) ? value.map((v, i) => [String(i), v]) : Object.entries(value);
}

function defaultExpandedPaths(data: unknown, maxDepth: number): Set<string> {
  const expanded = new Set<string>();
  const walk = (value: unknown, path: string, depth: number) => {
    if (depth > maxDepth || !isExpandable(value)) return;
    expanded.add(path);
    for (const [key, child] of entriesOf(value)) walk(child, `${path}.${key}`, depth + 1);
  };
  walk(data, "$", 0);
  return expanded;
}

function formatPrimitive(value: unknown): { text: string; className: string } {
  if (value === null) return { text: "null", className: "text-fg-muted italic" };
  if (value === undefined) return { text: "undefined", className: "text-fg-muted italic" };
  if (typeof value === "string") return { text: `"${value}"`, className: "text-fg" };
  return { text: String(value), className: "text-fg" };
}

interface JSONNodeProps {
  value: unknown;
  path: string;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  /** Rendered before the value — the key/index label, or `null` at the root. */
  entryKey?: string;
}

function JSONNode({ value, path, expanded, onToggle, entryKey }: JSONNodeProps) {
  const keyPrefix =
    entryKey === undefined ? null : <span className="text-fg-secondary">{entryKey}: </span>;

  if (!isExpandable(value)) {
    const { text, className } = formatPrimitive(value);
    return (
      <div className="min-h-6 py-0.5 leading-6">
        {keyPrefix}
        <span className={className}>{text}</span>
      </div>
    );
  }

  const isArray = Array.isArray(value);
  const entries = entriesOf(value);
  const isOpen = expanded.has(path);
  const openBrace = isArray ? "[" : "{";
  const closeBrace = isArray ? "]" : "}";
  const count = entries.length;
  const countLabel = isArray
    ? `${count} item${count === 1 ? "" : "s"}`
    : `${count} key${count === 1 ? "" : "s"}`;

  if (count === 0) {
    return (
      <div className="min-h-6 py-0.5 leading-6">
        {keyPrefix}
        <span className="text-fg-muted">
          {openBrace}
          {closeBrace}
        </span>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => onToggle(path)}
        className="inline-flex min-h-6 items-center gap-1 rounded-sm leading-6 hover:text-accent focus-visible:outline-none focus-visible:shadow-focus-ring"
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          aria-hidden="true"
          className={cn(
            "shrink-0 text-fg-muted transition-transform duration-base",
            isOpen && "rotate-90"
          )}
        >
          <path d="M2 1L6 4L2 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {keyPrefix}
        <span className="text-fg-muted">{openBrace}</span>
        {!isOpen && <span className="text-fg-muted">{countLabel}</span>}
        {!isOpen && <span className="text-fg-muted">{closeBrace}</span>}
      </button>
      {isOpen && (
        <div className="ms-4 border-s border-ink-border ps-3">
          {entries.map(([key, child]) => (
            <JSONNode
              key={key}
              value={child}
              path={`${path}.${key}`}
              expanded={expanded}
              onToggle={onToggle}
              entryKey={key}
            />
          ))}
          <div className="text-fg-muted">{closeBrace}</div>
        </div>
      )}
    </div>
  );
}
