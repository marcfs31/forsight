import type { Meta, StoryObj } from "@storybook/react";
import { Delta } from "./Delta";

const meta: Meta<typeof Delta> = {
  title: "Forsight/Observability/Delta",
  component: Delta,
  decorators: [
    (Story) => (
      <div className="p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Delta>;

export const Growth: Story = {
  args: { value: 12.4 },
};

export const LatencyRegression: Story = {
  name: "Latency regression",
  args: { value: 30.2, goodDirection: "down" },
};

export const Flat: Story = {
  args: { value: 0 },
};

export const Neutral: Story = {
  name: "No better direction",
  args: { value: -6.1, goodDirection: "none" },
};

export const CustomUnit: Story = {
  name: "Custom unit",
  args: { value: -42, goodDirection: "down", format: (value: number) => `${value}ms` },
};
