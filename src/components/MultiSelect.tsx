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

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onChange" | "onSelect"
> {
  options: MultiSelectOption[];
  /** Selected option values. */
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  /** Placeholder for the filter input inside the popover. */
  searchPlaceholder?: string;
  /** Shown when the filter matches no option. */
  emptyMessage?: string;
}

/**
 * Searchable, filterable multi-select — the tag-picker sibling to
 * `Combobox`'s single-select. Selected options show as plain (non-
 * interactive) chips inside the trigger; removing one happens by
 * reopening the popover and unchecking it, the same as picking it did —
 * deliberately not a remove button on each chip, since that would nest an
 * interactive control inside the trigger `<button>`, which is invalid
 * HTML. Picking an option leaves the popover open (unlike `Combobox`) so
 * multiple picks in a row don't need reopening. Pass `aria-label` for the
 * trigger's accessible name — same caveat as `Combobox`: it replaces the
 * visible chips/placeholder for assistive tech, so word it as the field's
 * purpose, not a repeat of the placeholder.
 */
export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
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
    const selected = options.filter((option) => value.includes(option.value));

    /**
     * The popover below is a Radix `role="dialog"`, which needs its own
     * accessible name — it is composed internally, so a consumer has no way to
     * label it. Mirror whatever names the trigger, so the dialog is announced
     * with the field's purpose rather than a generic string. Same reasoning
     * (and same shape) as `Combobox`.
     */
    const triggerLabel = props["aria-label"];
    const triggerLabelledBy = props["aria-labelledby"];
    const dialogLabel = triggerLabelledBy
      ? { "aria-labelledby": triggerLabelledBy }
      : { "aria-label": triggerLabel ?? placeholder };

    const toggle = (optionValue: string) => {
      onValueChange(
        value.includes(optionValue)
          ? value.filter((v) => v !== optionValue)
          : [...value, optionValue]
      );
    };

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={ref}
            type="button"
            disabled={disabled}
            className={cn(
              "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-ink-border bg-ink-surface px-3 py-2 text-sm font-sans text-fg transition-colors duration-base",
              "focus-visible:outline-none focus-visible:shadow-focus-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          >
            {selected.length === 0 ? (
              <span className="min-w-0 truncate text-start text-fg-muted">{placeholder}</span>
            ) : (
              selected.map((option) => (
                <span
                  key={option.value}
                  className="inline-flex max-w-full items-center rounded-full bg-ink-surface-2 px-2 py-0.5 text-xs font-medium text-fg-secondary"
                >
                  <span className="truncate">{option.label}</span>
                </span>
              ))
            )}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className="ms-auto shrink-0 text-fg-muted"
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
            {...dialogLabel}
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
                  {options.map((option) => {
                    const isSelected = value.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        disabled={option.disabled}
                        onSelect={() => toggle(option.value)}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-ink-border",
                            isSelected && "border-accent bg-accent"
                          )}
                        >
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path
                                d="M1.5 5L4 7.5L8.5 2.5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-accent-fg"
                              />
                            </svg>
                          )}
                        </span>
                        {option.label}
                        {/* cmdk's own aria-selected reflects keyboard highlight,
                            not "checked" — this text carries the real checked
                            state for assistive tech, since the checkbox mark
                            above is aria-hidden. */}
                        <span className="sr-only">{isSelected ? " (selected)" : ""}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);
MultiSelect.displayName = "MultiSelect";
