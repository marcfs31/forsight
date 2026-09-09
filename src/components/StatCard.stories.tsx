import type { Meta, StoryObj } from "@storybook/react";
import { StatCard } from "./StatCard";

const trend = [310, 302, 288, 296, 271, 264, 258, 249, 252, 244, 240, 248];

const meta: Meta<typeof StatCard> = {
  title: "Forsight/Observability/StatCard",
  component: StatCard,
  decorators: [
    (Story) => (
      <div className="w-full max-w-xs p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    label: "Requests",
    value: "1.24M",
    delta: 8.4,
    deltaCaption: "vs. previous 24h",
  },
};

export const LatencyWithTrend: Story = {
  name: "Latency (lower is better)",
  args: {
    label: "p95 latency",
    value: "248",
    unit: "ms",
    delta: -12.4,
    deltaGoodDirection: "down",
    deltaCaption: "vs. previous 24h",
    trend,
    status: "operational",
  },
};

export const Alerting: Story = {
  args: {
    label: "Error rate",
    value: "4.1",
    unit: "%",
    delta: 320,
    deltaGoodDirection: "down",
    deltaCaption: "vs. previous hour",
    trend: [0.2, 0.3, 0.2, 0.4, 0.9, 1.8, 2.6, 3.4, 4.1],
    trendTone: "danger",
    status: "degraded",
  },
};

export const Row: Story = {
  name: "Dashboard row",
  render: () => (
    <div className="grid w-[min(72rem,calc(100vw-2rem))] gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Requests" value="1.24M" delta={8.4} deltaCaption="vs. 24h" />
      <StatCard
        label="p95 latency"
        value="248"
        unit="ms"
        delta={-12.4}
        deltaGoodDirection="down"
        deltaCaption="vs. 24h"
        trend={trend}
      />
      <StatCard
        label="Error rate"
        value="0.42"
        unit="%"
        delta={0.1}
        deltaGoodDirection="down"
        deltaCaption="vs. 24h"
        status="operational"
      />
      <StatCard label="Deploys" value="14" delta={0} deltaCaption="vs. 24h" />
    </div>
  ),
  decorators: [(Story) => <Story />],
};
