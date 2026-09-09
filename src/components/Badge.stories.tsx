import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Forsight/Feedback/Badge",
  component: Badge,
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Neutral: Story = { args: { variant: "neutral", children: "Draft" } };
export const Accent: Story = { args: { variant: "accent", children: "New" } };
export const Spark: Story = { args: { variant: "spark", children: "Featured" } };
export const Success: Story = { args: { variant: "success", children: "Shipped" } };
export const Warning: Story = { args: { variant: "warning", children: "Pending review" } };
export const Danger: Story = { args: { variant: "danger", children: "Failed" } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="neutral">Draft</Badge>
      <Badge variant="accent">New</Badge>
      <Badge variant="spark">Featured</Badge>
      <Badge variant="success">Shipped</Badge>
      <Badge variant="warning">Pending review</Badge>
      <Badge variant="danger">Failed</Badge>
    </div>
  ),
};
