import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "./Toggle";

const PinIcon = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M7 1L7 7M2 7H12L10 12H4L2 7Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

const meta: Meta<typeof Toggle> = {
  title: "Fors/Forms/Toggle",
  component: Toggle,
};
export default meta;
type Story = StoryObj<typeof Toggle>;

export const TextLabel: Story = {
  render: () => <Toggle aria-label="Show grid lines">Grid</Toggle>,
};

export const IconOnly: Story = {
  render: () => (
    <Toggle aria-label="Pin sidebar" defaultPressed>
      {PinIcon}
    </Toggle>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle size="sm" aria-label="Grid (small)">
        Grid
      </Toggle>
      <Toggle size="md" aria-label="Grid (medium)">
        Grid
      </Toggle>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Toggle aria-label="Show grid lines" disabled>
      Grid
    </Toggle>
  ),
};
