import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../lib/cn";
import { POPPER_ANIMATION_CLASSES } from "../lib/animation";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "./Command";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onChange" | "onSelect"
> {
  options: ComboboxOption[];
  /** Selected option's `value`, or `null`/`undefined` for none selected. */
  value?: string | null;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Placeholder for the filter input inside the popover. */
  searchPlaceholder?: string;
  /** Shown when the filter matches no option. */
  emptyMessage?: string;
}

/**
 * Searchable, filterable single-select — the "type to narrow, then pick
 * one" pattern `Select` doesn't cover (a plain Radix select has no search
 * box). Reach for this once a list gets long enough that scanning it
 * un-filtered is slow; for a short, fully-known list, `Select` is simpler
 * and needs no typing. Internally composes `Popover` + `Command` (exactly
 * what you'd hand-roll yourself) so the trigger, filtering, keyboard model,
 * and focus-return behavior all come from those two primitives — pass
 * `aria-label` (or `aria-labelledby`) for the trigger's accessible name,
 * same as any other unlabeled control. An `aria-label` replaces the visible
 * placeholder/value text for assistive tech (it doesn't append to it), so
 * word it as the field's purpose (e.g. `"Framework"`), not a repeat of the
 * placeholder copy.
 */
export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Select...",
      searchPlaceholder = "Search...",
      emptyMessage = "No results.",
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const selected = options.find((option) => option.value === value);

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-ink-border bg-ink-surface px-3 text-sm font-sans text-fg transition-colors duration-base",
              "focus-visible:outline-none focus-visible:shadow-focus-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          >
            <span className={cn("min-w-0 truncate text-start", !selected && "text-fg-muted")}>
              {selected ? selected.label : placeholder}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className="shrink-0 text-fg-muted"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={8}
            className={cn(
              "z-50 w-[var(--radix-popper-anchor-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-ink-border bg-ink-surface p-0 shadow-lg outline-none",
              POPPER_ANIMATION_CLASSES
            )}
          >
            <Command className="rounded-none border-0 shadow-none" label={placeholder}>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      disabled={option.disabled}
                      onSelect={() => {
                        onValueChange?.(option.value);
                        setOpen(false);
                      }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        aria-hidden="true"
                        className={cn("shrink-0", option.value !== value && "invisible")}
                      >
                        <path
                          d="M1.5 5L4 7.5L8.5 2.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);
Combobox.displayName = "Combobox";
