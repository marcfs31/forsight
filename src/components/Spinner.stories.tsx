import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";
import { Button } from "./Button";

const meta: Meta<typeof Spinner> = {
  title: "Forsight/Feedback/Spinner",
  component: Spinner,
};
export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = { args: {} };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-accent">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};

export const InsideButton: Story = {
  render: () => (
    <Button disabled leadingIcon={<Spinner size="sm" />}>
      Deploying…
    </Button>
  ),
};
