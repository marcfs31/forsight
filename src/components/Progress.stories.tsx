import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./Progress";

const meta: Meta<typeof Progress> = {
  title: "Forsight/Feedback/Progress",
  component: Progress,
  args: { "aria-label": "Upload progress" },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Progress>;

export const Empty: Story = { args: { value: 0 } };
export const Halfway: Story = { args: { value: 50 } };
export const NearlyDone: Story = { args: { value: 92 } };
