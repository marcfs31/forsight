import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Forsight/Forms/Textarea",
  component: Textarea,
  // Like Input: needs a real label. App code binds a `<label htmlFor>` to
  // the Textarea's `id`; the stories use `aria-label` to stay compact.
  args: { "aria-label": "Description" },
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: "Describe the issue you're seeing…" },
};

export const WithHint: Story = {
  args: {
    "aria-label": "Project description",
    placeholder: "Project description",
    hint: "Shown on your public project page.",
  },
};

export const Invalid: Story = {
  args: {
    "aria-label": "Feedback",
    placeholder: "Feedback",
    invalid: true,
    hint: "Feedback must be at least 20 characters.",
  },
};
