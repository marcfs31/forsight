import type { Meta, StoryObj } from "@storybook/react";
import { Heatmap } from "./Heatmap";

const hours = Array.from({ length: 12 }, (_, i) => String(i * 2).padStart(2, "0"));

const meta: Meta<typeof Heatmap> = {
  title: "Forsight/Data Viz/Heatmap",
  component: Heatmap,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Heatmap>;

export const ErrorsByService: Story = {
  name: "Errors by service and hour",
  args: {
    label: "5xx responses by service and hour (UTC)",
    columns: hours,
    rows: [
      { label: "checkout", values: [0, 0, 2, 1, 0, 4, 18, 44, 96, 31, 6, 1] },
      { label: "search", values: [1, 0, 0, 0, 2, 3, 5, 9, 12, 7, 2, 0] },
      { label: "payments", values: [0, 0, 0, 0, 0, 0, 1, 3, 22, 4, 0, 0] },
      { label: "notifications", values: [0, 1, 0, null, null, 0, 2, 2, 3, 1, 0, 0] },
    ],
  },
};

export const DeployActivity: Story = {
  name: "Deploy activity",
  args: {
    label: "Deploys by weekday and hour",
    columns: hours,
    rows: [
      { label: "Mon", values: [0, 0, 0, 1, 3, 6, 8, 5, 4, 2, 1, 0] },
      { label: "Tue", values: [0, 0, 0, 2, 5, 9, 11, 7, 3, 1, 0, 0] },
      { label: "Wed", values: [0, 0, 1, 2, 4, 7, 9, 6, 3, 2, 0, 0] },
      { label: "Thu", values: [0, 0, 0, 1, 4, 8, 12, 9, 5, 2, 1, 0] },
      { label: "Fri", values: [0, 0, 0, 1, 2, 4, 5, 2, 1, 0, 0, 0] },
    ],
  },
};
