import type { Meta, StoryObj } from "@storybook/react";
import { BoxPlot } from "./BoxPlot";
import { formatDuration } from "../lib/chart";

const meta: Meta<typeof BoxPlot> = {
  title: "Forsight/Data Viz/BoxPlot",
  component: BoxPlot,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof BoxPlot>;

export const LatencyByService: Story = {
  render: () => (
    <div className="p-8">
      <BoxPlot
        label="Request duration spread by service, last hour"
        valueFormat={formatDuration}
        boxes={[
          { label: "checkout", min: 40, q1: 80, median: 120, q3: 180, max: 420 },
          { label: "search", min: 20, q1: 35, median: 50, q3: 70, max: 160 },
          { label: "payments", min: 90, q1: 140, median: 210, q3: 310, max: 680 },
        ]}
      />
    </div>
  ),
};

export const SingleBox: Story = {
  render: () => (
    <div className="p-8">
      <BoxPlot
        label="Payload size"
        boxes={[{ label: "checkout", min: 1, q1: 2, median: 3, q3: 5, max: 12 }]}
      />
    </div>
  ),
};
