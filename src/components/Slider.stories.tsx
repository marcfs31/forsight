import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
  title: "Forsight/Forms/Slider",
  component: Slider,
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Slider>;

export const SingleThumb: Story = {
  args: { defaultValue: [40], max: 100, step: 1, "aria-label": "Volume" },
};

export const Range: Story = {
  args: {
    defaultValue: [20, 80],
    max: 100,
    step: 1,
    "aria-label": ["Minimum price", "Maximum price"],
  },
};
