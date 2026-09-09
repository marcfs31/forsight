import type { Meta, StoryObj } from "@storybook/react";
import { DonutChart } from "./DonutChart";

const meta: Meta<typeof DonutChart> = {
  title: "Forsight/Data Viz/DonutChart",
  component: DonutChart,
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof DonutChart>;

export const TrafficByRegion: Story = {
  name: "Traffic by region",
  args: {
    label: "Traffic by region",
    description: "Share of requests, last 24 hours",
    data: [
      { name: "us-east", value: 482_000 },
      { name: "eu-west", value: 291_000 },
      { name: "ap-south", value: 118_000 },
      { name: "sa-east", value: 39_000 },
    ],
    centerLabel: "requests",
  },
};

export const ErrorBreakdown: Story = {
  name: "Error breakdown",
  args: {
    label: "5xx responses by cause",
    data: [
      { name: "upstream timeout", value: 640 },
      { name: "connection reset", value: 210 },
      { name: "out of memory", value: 96 },
    ],
    centerLabel: "errors",
  },
};
