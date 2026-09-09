import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./Separator";
import { Text } from "./Text";

const meta: Meta<typeof Separator> = {
  title: "Forsight/Data Display/Separator",
  component: Separator,
};
export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-72">
      <Text size="sm">Deployment settings</Text>
      <Separator className="my-3" />
      <Text size="sm" tone="secondary">
        Environment variables, domains, and integrations.
      </Text>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-3">
      <Text size="sm">Overview</Text>
      <Separator orientation="vertical" />
      <Text size="sm">Activity</Text>
      <Separator orientation="vertical" />
      <Text size="sm">Settings</Text>
    </div>
  ),
};
