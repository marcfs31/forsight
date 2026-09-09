import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Forsight/Forms/Button",
  component: Button,
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: "primary", children: "Start a project" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "View proposal" },
};

export const Spark: Story = {
  args: { variant: "spark", children: "Upgrade plan" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Cancel" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Delete workspace" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { variant: "primary", children: "Processing…", disabled: true },
};

export const Loading: Story = {
  args: { variant: "primary", children: "Deploying…", loading: true },
};
