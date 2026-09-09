import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "Forsight/Typography/Text",
  component: Text,
};
export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = { args: { children: "Deployed 3 minutes ago by Marc." } };
export const Secondary: Story = {
  args: { tone: "secondary", children: "Last edited on March 4, 2026." },
};
export const Muted: Story = {
  args: { tone: "muted", size: "sm", children: "No activity in the last 30 days." },
};
export const Danger: Story = {
  args: { tone: "danger", size: "sm", children: "This action cannot be undone." },
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Text tone="default">Default tone</Text>
      <Text tone="secondary">Secondary tone</Text>
      <Text tone="muted">Muted tone</Text>
      <Text tone="accent">Accent tone</Text>
      <Text tone="danger">Danger tone</Text>
    </div>
  ),
};
