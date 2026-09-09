import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { FilterBar, type FilterBarFacet, type FilterBarOption } from "./FilterBar";

const OPTIONS: FilterBarOption[] = [
  { facetKey: "service", facetLabel: "Service", value: "checkout-api", label: "checkout-api" },
  { facetKey: "service", facetLabel: "Service", value: "search-api", label: "search-api" },
  { facetKey: "env", facetLabel: "Environment", value: "production", label: "Production" },
];

const FILTERS: FilterBarFacet[] = [{ key: "service", label: "Service", value: "checkout-api" }];

// .focus() + keyboard("{Enter}"), never .click() — jsdom lacks pointer
// capture, and clicking a Radix Popover trigger to open it is dramatically
// slower than the keyboard path. See the `testing` skill / Combobox.test.tsx.
async function openAddFilter() {
  screen.getByRole("button", { name: "Add filter" }).focus();
  await userEvent.keyboard("{Enter}");
}

describe("FilterBar", () => {
  it("renders a chip per applied filter", () => {
    render(
      <FilterBar label="Filters" filters={FILTERS} onFiltersChange={vi.fn()} options={OPTIONS} />
    );
    expect(screen.getByText("checkout-api")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove Service: checkout-api filter" })
    ).toBeInTheDocument();
  });

  it("calls onFiltersChange with the filter removed when its chip is closed", async () => {
    const onFiltersChange = vi.fn();
    render(
      <FilterBar
        label="Filters"
        filters={FILTERS}
        onFiltersChange={onFiltersChange}
        options={OPTIONS}
      />
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Service: checkout-api filter" })
    );
    expect(onFiltersChange).toHaveBeenCalledWith([]);
  });

  it("only shows Clear all when there is at least one filter", () => {
    const { rerender } = render(
      <FilterBar label="Filters" filters={[]} onFiltersChange={vi.fn()} options={OPTIONS} />
    );
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();

    rerender(
      <FilterBar label="Filters" filters={FILTERS} onFiltersChange={vi.fn()} options={OPTIONS} />
    );
    expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
  });

  it("calls onFiltersChange with an empty list when Clear all is clicked", async () => {
    const onFiltersChange = vi.fn();
    render(
      <FilterBar
        label="Filters"
        filters={FILTERS}
        onFiltersChange={onFiltersChange}
        options={OPTIONS}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onFiltersChange).toHaveBeenCalledWith([]);
  });

  it("lists available options grouped by facet, excluding already-applied ones", async () => {
    render(
      <FilterBar label="Filters" filters={FILTERS} onFiltersChange={vi.fn()} options={OPTIONS} />
    );
    await openAddFilter();
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Environment")).toBeInTheDocument();
    // checkout-api is already applied, so it's excluded from the add list.
    expect(screen.queryByRole("option", { name: "checkout-api" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "search-api" })).toBeInTheDocument();
  });

  it("calls onFiltersChange with the new facet appended when an option is picked", async () => {
    const onFiltersChange = vi.fn();
    render(
      <FilterBar
        label="Filters"
        filters={FILTERS}
        onFiltersChange={onFiltersChange}
        options={OPTIONS}
      />
    );
    await openAddFilter();
    await userEvent.click(screen.getByRole("option", { name: "Production" }));
    expect(onFiltersChange).toHaveBeenCalledWith([
      ...FILTERS,
      { key: "env", label: "Environment", value: "production" },
    ]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FilterBar label="Filters" filters={FILTERS} onFiltersChange={vi.fn()} options={OPTIONS} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
