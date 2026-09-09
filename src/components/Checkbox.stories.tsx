import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Forsight/Forms/Checkbox",
  component: Checkbox,
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

function LabeledCheckbox(props: React.ComponentProps<typeof Checkbox> & { label: string }) {
  const { label, id = "cb", ...rest } = props;
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} {...rest} />
      <label htmlFor={id} className="font-sans text-sm text-fg">
        {label}
      </label>
    </div>
  );
}

export const Unchecked: Story = {
  render: () => <LabeledCheckbox id="terms" label="I agree to the terms of service" />,
};

export const Checked: Story = {
  render: () => (
    <LabeledCheckbox id="notify" label="Email me about deploy failures" defaultChecked />
  ),
};

export const Disabled: Story = {
  render: () => (
    <LabeledCheckbox id="locked" label="Managed by your organization" disabled defaultChecked />
  ),
};
