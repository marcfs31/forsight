import type { Meta, StoryObj } from "@storybook/react";
import { BarChart } from "./BarChart";

const buckets = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

const meta: Meta<typeof BarChart> = {
  title: "Fors/Data Viz/BarChart",
  component: BarChart,
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof BarChart>;

export const SingleSeries: Story = {
  args: {
    label: "Deploys per hour",
    labels: buckets,
    series: [{ name: "deploys", values: [3, 5, 2, 8, 6, 4] }],
  },
};

export const Grouped: Story = {
  args: {
    label: "Responses by service",
    description: "Compare services against each other — no total is implied.",
    labels: buckets,
    series: [
      { name: "checkout", values: [1200, 1420, 1310, 1680, 1520, 1390] },
      { name: "search", values: [890, 940, 1020, 1240, 1180, 1010] },
    ],
  },
};

export const Stacked: Story = {
  args: {
    label: "Responses by status class",
    description: "The segments sum to total traffic in each hour.",
    labels: buckets,
    series: [
      { name: "2xx", values: [1200, 1420, 1310, 1680, 1520, 1390] },
      { name: "4xx", values: [90, 120, 105, 260, 180, 140] },
      { name: "5xx", values: [4, 6, 3, 88, 22, 9] },
    ],
    stacked: true,
  },
};

export const WithAnnotations: Story = {
  name: "With annotations",
  args: {
    label: "Responses by service",
    labels: buckets,
    series: [
      { name: "checkout", values: [1200, 1420, 1310, 1680, 1520, 1390] },
      { name: "search", values: [890, 940, 1020, 1240, 1180, 1010] },
    ],
    annotations: [
      { value: 2000, text: "Capacity: 2000 req/s", tone: "warning" },
      { label: "13:00", text: "Cache config rollback", tone: "danger" },
    ],
  },
};
