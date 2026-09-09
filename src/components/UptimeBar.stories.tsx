import type { Meta, StoryObj } from "@storybook/react";
import { UptimeBar } from "./UptimeBar";
import type { ServiceStatus } from "./StatusDot";

/** 90 days that are healthy apart from a two-day incident and a maintenance window. */
const ninetyDays = Array.from({ length: 90 }, (_, i) => {
  const status: ServiceStatus =
    i === 61 ? "outage" : i === 62 ? "degraded" : i === 80 ? "maintenance" : "operational";
  return {
    label: `Day ${i + 1}`,
    status,
    detail:
      i === 61
        ? "primary database failover"
        : i === 62
          ? "elevated p99 during backfill"
          : undefined,
  };
});

const meta: Meta<typeof UptimeBar> = {
  title: "Forsight/Observability/UptimeBar",
  component: UptimeBar,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof UptimeBar>;

export const NinetyDays: Story = {
  name: "90 days",
  args: {
    label: "checkout-api",
    segments: ninetyDays,
    startCaption: "90 days ago",
    endCaption: "Today",
  },
};

export const NewService: Story = {
  name: "New service (partial history)",
  args: {
    label: "recommendations-api",
    segments: [
      ...Array.from({ length: 20 }, (_, i) => ({
        label: `Day ${i + 1}`,
        status: "unknown" as const,
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        label: `Day ${i + 21}`,
        status: "operational" as const,
      })),
    ],
    startCaption: "30 days ago",
    endCaption: "Today",
  },
};
