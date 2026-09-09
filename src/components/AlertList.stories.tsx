import type { Meta, StoryObj } from "@storybook/react";
import { AlertList } from "./AlertList";

const meta: Meta<typeof AlertList> = {
  title: "Fors/Observability/AlertList",
  component: AlertList,
};
export default meta;
type Story = StoryObj<typeof AlertList>;

export const ActiveAndResolved: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <AlertList
        label="Active alerts"
        items={[
          {
            id: "1",
            severity: "critical",
            title: "Elevated 5xx rate on checkout-api",
            description: "Error rate above 5% for 10 minutes.",
            source: "checkout-api",
            time: "2 min ago",
          },
          {
            id: "2",
            severity: "warning",
            title: "p99 latency above threshold",
            description: "p99 at 620ms, threshold 500ms.",
            source: "search-api",
            time: "8 min ago",
          },
          {
            id: "3",
            severity: "info",
            title: "Disk usage above 80%",
            source: "worker-3",
            time: "20 min ago",
            resolved: true,
          },
        ]}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <AlertList label="Active alerts" items={[]} emptyMessage="No active alerts." />
    </div>
  ),
};
