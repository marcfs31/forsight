import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MultiSelect } from "./MultiSelect";

const OPTIONS = [
  { value: "checkout-api", label: "checkout-api" },
  { value: "search-api", label: "search-api" },
  { value: "payments-api", label: "payments-api" },
  { value: "worker-queue", label: "worker-queue", disabled: true },
];

const meta: Meta<typeof MultiSelect> = {
  title: "Fors/Forms/MultiSelect",
  component: MultiSelect,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof MultiSelect>;

export const Empty: Story = {
  render: function EmptyMultiSelect() {
    const [value, setValue] = React.useState<string[]>([]);
    return (
      <div className="w-72">
        <MultiSelect
          options={OPTIONS}
          value={value}
          onValueChange={setValue}
          placeholder="Select services..."
          aria-label="Services"
        />
      </div>
    );
  },
};

export const WithSelection: Story = {
  render: function SelectedMultiSelect() {
    const [value, setValue] = React.useState<string[]>(["checkout-api", "search-api"]);
    return (
      <div className="w-72">
        <MultiSelect
          options={OPTIONS}
          value={value}
          onValueChange={setValue}
          placeholder="Select services..."
          aria-label="Services"
        />
      </div>
    );
  },
};
