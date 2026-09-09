import type { Meta, StoryObj } from "@storybook/react";
import { Gauge } from "./Gauge";
import { formatPercent } from "../lib/chart";

const meta: Meta<typeof Gauge> = {
  title: "Forsight/Data Viz/Gauge",
  component: Gauge,
  decorators: [
    (Story) => (
      <div className="p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Gauge>;

export const ErrorBudget: Story = {
  name: "Error budget",
  args: {
    label: "Error budget",
    caption: "of the 30-day budget remaining",
    value: 62,
    valueFormat: (value) => formatPercent(value, 0),
  },
};

export const Saturation: Story = {
  args: {
    label: "Disk usage",
    caption: "primary volume",
    value: 88,
    tone: "warning",
    valueFormat: (value) => formatPercent(value, 0),
  },
};

export const AgainstAnSLO: Story = {
  name: "Against an SLO",
  args: {
    label: "Availability",
    caption: "target 99.9%",
    value: 99.94,
    min: 99,
    max: 100,
    target: 99.9,
    tone: "success",
    valueFormat: (value) => formatPercent(value, 2),
  },
};
