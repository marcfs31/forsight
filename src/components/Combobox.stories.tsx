import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "@storybook/test";
import { Combobox } from "./Combobox";

const FRAMEWORKS = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt", label: "Nuxt", disabled: true },
];

const meta: Meta<typeof Combobox> = {
  title: "Fors/Forms/Combobox",
  component: Combobox,
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj<typeof Combobox>;

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <Combobox
        options={FRAMEWORKS}
        placeholder="Select framework..."
        searchPlaceholder="Search frameworks..."
        emptyMessage="No framework found."
        aria-label="Framework"
      />
    </div>
  ),
};

export const Controlled: Story = {
  render: function ControlledCombobox() {
    const [value, setValue] = React.useState<string | null>("remix");
    return (
      <div className="w-64">
        <Combobox
          options={FRAMEWORKS}
          value={value}
          onValueChange={setValue}
          placeholder="Select framework..."
          aria-label="Framework"
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-64">
      <Combobox
        options={FRAMEWORKS}
        disabled
        placeholder="Select framework..."
        aria-label="Framework"
      />
    </div>
  ),
};

/**
 * Real-browser interaction: opens the popover, filters by typing, and
 * selects a result — the full flow jsdom can't drive reliably (Radix
 * popper positioning + cmdk's filtering).
 */
export const SearchAndSelect: Story = {
  render: function SearchAndSelectCombobox() {
    const [value, setValue] = React.useState<string | null>(null);
    return (
      <div className="w-64">
        <Combobox
          options={FRAMEWORKS}
          value={value}
          onValueChange={setValue}
          placeholder="Select framework..."
          aria-label="Framework"
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Framework" }));

    const search = await within(document.body).findByRole("combobox");
    await userEvent.type(search, "rem");
    const option = await within(document.body).findByRole("option", { name: "Remix" });
    await userEvent.click(option);

    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Framework" })).toHaveTextContent("Remix")
    );
  },
};
