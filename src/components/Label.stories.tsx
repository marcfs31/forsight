import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./Label";
import { Input } from "./Input";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Label> = {
  title: "Forsight/Typography/Label",
  component: Label,
};
export default meta;
type Story = StoryObj<typeof Label>;

export const WithTextInput: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-1.5">
      <Label htmlFor="workspace-name">Workspace name</Label>
      <Input id="workspace-name" placeholder="acme-inc" />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="marketing-emails" defaultChecked />
      <Label htmlFor="marketing-emails">Send me product updates</Label>
    </div>
  ),
};
