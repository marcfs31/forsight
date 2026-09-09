import type { Meta, StoryObj } from "@storybook/react";
import { ComboChart } from "./ComboChart";
import { formatDuration } from "../lib/chart";

const meta: Meta<typeof ComboChart> = {
  title: "Forsight/Data Viz/ComboChart",
  component: ComboChart,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof ComboChart>;

const labels = ["12:00", "13:00", "14:00", "15:00", "16:00"];

export const RequestsAndLatency: Story = {
  render: () => (
    <div className="p-8">
      <ComboChart
        label="Request volume and p99 latency, last 4 hours"
        labels={labels}
        valueFormat={(v) => v.toLocaleString()}
        secondaryValueFormat={formatDuration}
        series={[
          { name: "Requests", type: "bar", values: [1200, 1800, 2100, 1650, 1400] },
          { name: "p99 latency", type: "line", values: [180, 210, 340, 260, 190] },
        ]}
      />
    </div>
  ),
};

export const MultipleBarsOneLine: Story = {
  render: () => (
    <div className="p-8">
      <ComboChart
        label="Requests by status class and error rate"
        labels={labels}
        secondaryValueFormat={(v) => `${v}%`}
        series={[
          { name: "2xx", type: "bar", values: [1100, 1700, 1950, 1500, 1300] },
          { name: "5xx", type: "bar", values: [12, 40, 90, 30, 15] },
          { name: "Error rate", type: "line", values: [1.1, 2.3, 4.6, 2.0, 1.2] },
        ]}
      />
    </div>
  ),
};

export const WithGap: Story = {
  render: () => (
    <div className="p-8">
      <ComboChart
        label="Requests and latency with a missing sample"
        labels={labels}
        secondaryValueFormat={formatDuration}
        series={[
          { name: "Requests", type: "bar", values: [1200, 1800, 2100, 1650, 1400] },
          { name: "p99 latency", type: "line", values: [180, null, 340, 260, 190] },
        ]}
      />
    </div>
  ),
};
