import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Forsight/Forms/Input",
  component: Input,
  // A text field needs a programmatic label — a placeholder is not one.
  // In app code, render a `<label htmlFor>` bound to the Input's `id`;
  // these stories use `aria-label` to keep the examples compact.
  args: { "aria-label": "Email" },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "you@example.com", type: "email" },
};

export const WithHint: Story = {
  args: {
    "aria-label": "Workspace name",
    placeholder: "Workspace name",
    hint: "Visible to everyone in your organization.",
  },
};

export const Invalid: Story = {
  args: {
    placeholder: "you@example.com",
    value: "not-an-email",
    invalid: true,
    hint: "Enter a valid email address.",
    onChange: () => {},
  },
};

export const Disabled: Story = {
  args: { "aria-label": "Locked field", placeholder: "Locked field", disabled: true },
};
