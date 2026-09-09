import type { Meta, StoryObj } from "@storybook/react";
import { Histogram } from "./Histogram";

const meta: Meta<typeof Histogram> = {
  title: "Fors/Data Viz/Histogram",
  component: Histogram,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof Histogram>;

export const RequestDuration: Story = {
  render: () => (
    <div className="p-8">
      <Histogram
        label="Request duration distribution, last hour"
        description="p95 is in the 100–150ms bucket."
        buckets={[
          { label: "0–25ms", count: 420 },
          { label: "25–50ms", count: 980 },
          { label: "50–100ms", count: 1640 },
          { label: "100–150ms", count: 860 },
          { label: "150–250ms", count: 310 },
          { label: "250ms+", count: 90 },
        ]}
      />
    </div>
  ),
};

export const SingleBucket: Story = {
  render: () => (
    <div className="p-8">
      <Histogram label="Payload size" buckets={[{ label: "0–1KB", count: 40 }]} />
    </div>
  ),
};
