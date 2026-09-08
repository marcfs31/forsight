import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "./Timeline";

const meta: Meta<typeof Timeline> = {
  title: "Fors/Observability/Timeline",
  component: Timeline,
  decorators: [
    (Story) => (
      <div className="w-full max-w-lg p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Timeline>;

export const IncidentTimeline: Story = {
  name: "Incident timeline",
  args: {
    items: [
      {
        id: "1",
        time: "14:02",
        title: "Alert fired — checkout 5xx above 2%",
        description: "Triggered by the checkout-api availability SLO burn-rate alert.",
        tone: "danger",
      },
      {
        id: "2",
        time: "14:05",
        title: "Acknowledged by @marc",
        tone: "warning",
      },
      {
        id: "3",
        time: "14:18",
        title: "Rolled back to 3e90c",
        description: "Error rate returned to baseline within 90 seconds.",
        tone: "accent",
      },
      { id: "4", time: "14:31", title: "Resolved", tone: "success" },
    ],
  },
};

export const DeployHistory: Story = {
  name: "Deploy history",
  args: {
    items: [
      { id: "1", time: "6 min ago", title: "checkout-api 4f21a", description: "by @marc" },
      { id: "2", time: "2 h ago", title: "search-api 91c0e", description: "by @lena" },
      { id: "3", time: "yesterday", title: "checkout-api 3e90c", description: "by @marc" },
    ],
  },
};
