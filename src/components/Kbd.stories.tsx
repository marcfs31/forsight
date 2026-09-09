import type { Meta, StoryObj } from "@storybook/react";
import { Kbd } from "./Kbd";

const meta: Meta<typeof Kbd> = {
  title: "Forsight/Data Display/Kbd",
  component: Kbd,
};
export default meta;
type Story = StoryObj<typeof Kbd>;

export const SingleKey: Story = {
  render: () => <Kbd>Esc</Kbd>,
};

export const Shortcut: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1">
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </span>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="flex w-64 items-center justify-between rounded-md border border-ink-border bg-ink-surface px-3 py-2">
      <span className="text-sm font-sans text-fg">Open command palette</span>
      <span className="inline-flex items-center gap-1">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </div>
  ),
};
