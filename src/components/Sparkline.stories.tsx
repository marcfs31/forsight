import type { Meta, StoryObj } from "@storybook/react";
import { Sparkline } from "./Sparkline";

const samples = [42, 48, 39, 51, 61, 55, 72, 68, 81, 76, 90, 84];

const meta: Meta<typeof Sparkline> = {
  title: "Forsight/Data Viz/Sparkline",
  component: Sparkline,
  decorators: [
    (Story) => (
      <div className="w-64 p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Sparkline>;

export const Line: Story = {
  args: { label: "Requests per second, last hour", values: samples },
};

export const Bars: Story = {
  args: { label: "Deploys per day, last 12 days", values: samples, variant: "bar" },
};

export const Alerting: Story = {
  name: "Alerting tone",
  args: { label: "Error rate, last hour", values: samples, tone: "danger" },
};
