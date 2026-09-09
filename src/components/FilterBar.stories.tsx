import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "@storybook/test";
import { FilterBar, type FilterBarFacet, type FilterBarOption } from "./FilterBar";

const OPTIONS: FilterBarOption[] = [
  { facetKey: "service", facetLabel: "Service", value: "checkout-api", label: "checkout-api" },
  { facetKey: "service", facetLabel: "Service", value: "search-api", label: "search-api" },
  { facetKey: "service", facetLabel: "Service", value: "payments-api", label: "payments-api" },
  { facetKey: "env", facetLabel: "Environment", value: "production", label: "Production" },
  { facetKey: "env", facetLabel: "Environment", value: "staging", label: "Staging" },
  { facetKey: "status", facetLabel: "Status", value: "error", label: "Error" },
  { facetKey: "status", facetLabel: "Status", value: "ok", label: "OK" },
];

const meta: Meta<typeof FilterBar> = {
  title: "Fors/Navigation/FilterBar",
  component: FilterBar,
};
export default meta;
type Story = StoryObj<typeof FilterBar>;

export const Empty: Story = {
  render: function EmptyFilterBar() {
    const [filters, setFilters] = React.useState<FilterBarFacet[]>([]);
    return (
      <FilterBar
        label="Dashboard filters"
        filters={filters}
        onFiltersChange={setFilters}
        options={OPTIONS}
      />
    );
  },
};

export const WithActiveFilters: Story = {
  render: function ActiveFilterBar() {
    const [filters, setFilters] = React.useState<FilterBarFacet[]>([
      { key: "service", label: "Service", value: "checkout-api" },
      { key: "env", label: "Environment", value: "production" },
    ]);
    return (
      <FilterBar
        label="Dashboard filters"
        filters={filters}
        onFiltersChange={setFilters}
        options={OPTIONS}
      />
    );
  },
};

/**
 * Real-browser interaction: opens the add-filter popover, picks an option,
 * then removes the resulting chip.
 */
export const AddAndRemove: Story = {
  render: function InteractiveFilterBar() {
    const [filters, setFilters] = React.useState<FilterBarFacet[]>([]);
    return (
      <FilterBar
        label="Dashboard filters"
        filters={filters}
        onFiltersChange={setFilters}
        options={OPTIONS}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Add filter" }));

    const search = await within(document.body).findByRole("combobox");
    await userEvent.type(search, "checkout");
    const option = await within(document.body).findByRole("option", { name: "checkout-api" });
    await userEvent.click(option);

    const removeButton = await canvas.findByRole("button", {
      name: "Remove Service: checkout-api filter",
    });
    await expect(removeButton).toBeInTheDocument();

    await userEvent.click(removeButton);
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: "Remove Service: checkout-api filter" })
      ).not.toBeInTheDocument()
    );
  },
};
