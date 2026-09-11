import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../lib/cn";
import { POPPER_ANIMATION_CLASSES } from "../lib/animation";
import { Button } from "./Button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "./Command";

export interface FilterBarFacet {
  /** Facet key, e.g. `"service"`. */
  key: string;
  /** Human label for the facet, e.g. `"Service"`. */
  label: string;
  value: string;
}

export interface FilterBarOption {
  facetKey: string;
  facetLabel: string;
  value: string;
  /** Visible option label, e.g. the value with friendlier casing. */
  label: string;
}

export interface FilterBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Accessible name for the filter bar, e.g. "Dashboard filters". */
  label: string;
  /** Currently applied facets, rendered as removable chips. */
  filters: FilterBarFacet[];
  onFiltersChange: (filters: FilterBarFacet[]) => void;
  /** Everything selectable via "Add filter", grouped by `facetLabel`. An option already present in `filters` is hidden from the list. */
  options: FilterBarOption[];
  /** Placeholder for the add-filter search input. */
  searchPlaceholder?: string;
}

/**
 * Faceted filter row for an observability dashboard header — service, env,
 * status, whatever the caller's data supports. Applied facets show as
 * removable chips; "Add filter" opens a searchable, grouped list (built on
 * `Popover` + `Command`, the same pairing `Combobox` uses) of everything
 * not already applied. This owns only the chip/add-menu chrome — `filters`
 * is controlled, so the caller decides what applying them actually does
 * (usually re-querying the data behind the dashboard).
 */
export const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      className,
      label,
      filters,
      onFiltersChange,
      options,
      searchPlaceholder = "Search filters...",
      ...props
    },
    ref
  ) => {
    const availableOptions = options.filter(
      (option) => !filters.some((f) => f.key === option.facetKey && f.value === option.value)
    );

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className={cn("flex flex-wrap items-center gap-2", className)}
        {...props}
      >
        {filters.map((facet, index) => (
          <FilterChip
            key={`${facet.key}-${facet.value}-${index}`}
            facet={facet}
            onRemove={() => onFiltersChange(filters.filter((_, i) => i !== index))}
          />
        ))}
        <AddFilterControl
          options={availableOptions}
          searchPlaceholder={searchPlaceholder}
          onAdd={(facet) => onFiltersChange([...filters, facet])}
        />
        {filters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onFiltersChange([])}>
            Clear all
          </Button>
        )}
      </div>
    );
  }
);
FilterBar.displayName = "FilterBar";

function FilterChip({ facet, onRemove }: { facet: FilterBarFacet; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink-border bg-ink-surface-2 ps-2.5 pe-1 text-xs font-medium font-sans text-fg-secondary">
      <span className="text-fg-muted">{facet.label}:</span> {facet.value}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${facet.label}: ${facet.value} filter`}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors duration-base hover:bg-ink-surface hover:text-fg focus-visible:outline-none focus-visible:shadow-focus-ring"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </span>
  );
}

function groupByFacetLabel(options: FilterBarOption[]): Map<string, FilterBarOption[]> {
  const groups = new Map<string, FilterBarOption[]>();
  for (const option of options) {
    const list = groups.get(option.facetLabel) ?? [];
    list.push(option);
    groups.set(option.facetLabel, list);
  }
  return groups;
}

function AddFilterControl({
  options,
  searchPlaceholder,
  onAdd,
}: {
  options: FilterBarOption[];
  searchPlaceholder?: string;
  onAdd: (facet: FilterBarFacet) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const groups = groupByFacetLabel(options);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button variant="ghost" size="sm">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Add filter
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          // Radix renders this as `role="dialog"`, which needs its own
          // accessible name. Unlike Combobox/MultiSelect there is nothing to
          // derive it from — this popover is internal and single-purpose — so
          // it mirrors the trigger's own visible name, which is also what the
          // `Command` below is labelled.
          aria-label="Add filter"
          className={cn(
            "z-50 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-ink-border bg-ink-surface p-0 shadow-lg outline-none",
            POPPER_ANIMATION_CLASSES
          )}
        >
          <Command className="rounded-none border-0 shadow-none" label="Add filter">
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>No matches.</CommandEmpty>
              {[...groups.entries()].map(([facetLabel, facetOptions]) => (
                <CommandGroup key={facetLabel} heading={facetLabel}>
                  {facetOptions.map((option) => (
                    <CommandItem
                      key={`${option.facetKey}-${option.value}`}
                      value={`${facetLabel} ${option.label}`}
                      onSelect={() => {
                        onAdd({
                          key: option.facetKey,
                          label: option.facetLabel,
                          value: option.value,
                        });
                        setOpen(false);
                      }}
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
