import type { Meta, StoryObj } from "@storybook/react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./Select";

const meta: Meta = {
  title: "Forsight/Forms/Select",
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Select defaultValue="vercel">
      <SelectTrigger className="w-56" aria-label="Deploy target">
        <SelectValue placeholder="Choose a deploy target" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="vercel">Vercel</SelectItem>
        <SelectItem value="netlify">Netlify</SelectItem>
        <SelectItem value="fly">Fly.io</SelectItem>
        <SelectItem value="self-hosted">Self-hosted</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Placeholder: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56" aria-label="Region">
        <SelectValue placeholder="Select a region" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="iad1">Washington, D.C. (iad1)</SelectItem>
        <SelectItem value="arn1">Stockholm (arn1)</SelectItem>
        <SelectItem value="sfo1">San Francisco (sfo1)</SelectItem>
      </SelectContent>
    </Select>
  ),
};
