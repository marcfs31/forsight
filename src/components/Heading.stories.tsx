import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
  title: "Forsight/Typography/Heading",
  component: Heading,
};
export default meta;
type Story = StoryObj<typeof Heading>;

export const Page: Story = {
  args: { as: "h1", size: "2xl", children: "Build faster. Own it forever." },
};
export const Section: Story = { args: { as: "h2", size: "xl", children: "Recent deployments" } };
export const Subsection: Story = {
  args: { as: "h3", size: "md", children: "Environment variables" },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Heading size="2xl">2XL heading</Heading>
      <Heading size="xl">XL heading</Heading>
      <Heading size="lg">LG heading</Heading>
      <Heading size="md">MD heading</Heading>
      <Heading size="sm">SM heading</Heading>
    </div>
  ),
};
