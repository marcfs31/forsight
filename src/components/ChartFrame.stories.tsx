import type { Meta, StoryObj } from "@storybook/react";
import { ChartFrame } from "./ChartFrame";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip } from "./ChartTooltip";
import { linePath, niceScale, project, seriesStroke } from "../lib/chart";

const meta: Meta = {
  title: "Fors/Data Viz/ChartFrame",
  parameters: {
    docs: {
      description: {
        component:
          "The shell the built-in charts render into. Use it directly for a plot this package doesn't ship — it supplies the measured SVG, the accessible name, and the data table that stands in for the picture.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj;

const values = [3, 9, 5, 14, 11, 18, 12];
const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const CustomPlot: Story = {
  name: "A custom plot",
  render: () => {
    const scale = niceScale(0, Math.max(...values));
    return (
      <ChartFrame
        label="Incidents per day"
        description="A hand-drawn plot using the frame's geometry and the shared scales."
        height={180}
        columns={labels}
        rows={[{ header: "incidents", cells: values.map(String) }]}
      >
        {({ width, height }) => (
          <path
            d={linePath(
              values.map((value, index) => [
                (index / (values.length - 1)) * (width - 16) + 8,
                height - 8 - project(value, scale.min, scale.max, height - 16),
              ])
            )}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            className={seriesStroke(0)}
          />
        )}
      </ChartFrame>
    );
  },
};

export const LegendAndTooltip: Story = {
  name: "Legend and tooltip",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <ChartLegend
        items={[
          { label: "us-east", seriesIndex: 0, value: "62%" },
          { label: "eu-west", seriesIndex: 1, value: "28%" },
          { label: "Other", value: "10%" },
        ]}
      />
      <ChartTooltip
        title="14:00"
        rows={[
          { label: "us-east", seriesIndex: 0, value: "1.8k" },
          { label: "eu-west", seriesIndex: 1, value: "820" },
        ]}
      />
    </div>
  ),
};
