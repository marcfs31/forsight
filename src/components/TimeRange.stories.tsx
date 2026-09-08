import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import * as React from "react";
import { TimeRange } from "./TimeRange";

const options = [
  { value: "1h", label: "1h", description: "Last 1 hour" },
  { value: "6h", label: "6h", description: "Last 6 hours" },
  { value: "24h", label: "24h", description: "Last 24 hours" },
  { value: "7d", label: "7d", description: "Last 7 days" },
  { value: "30d", label: "30d", description: "Last 30 days" },
];

function Example({ initial = "24h" }: { initial?: string }) {
  const [value, setValue] = React.useState(initial);
  return (
    <div className="flex flex-col items-start gap-3">
      <TimeRange
        label="Dashboard time range"
        options={options}
        value={value}
        onValueChange={setValue}
      />
      <p className="text-sm font-sans text-fg-secondary">
        Charts would reload for <span className="font-mono text-fg">{value}</span>.
      </p>
    </div>
  );
}

const meta: Meta = {
  title: "Fors/Observability/TimeRange",
  decorators: [
    (Story) => (
      <div className="p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <Example />,
};

export const Keyboard: Story = {
  name: "Keyboard selection",
  render: () => <Example initial="1h" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("radio", { name: "Last 1 hour" }).focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect(canvas.getByRole("radio", { name: "Last 24 hours" })).toBeChecked();
    await userEvent.keyboard("{End}");
    await expect(canvas.getByRole("radio", { name: "Last 30 days" })).toBeChecked();
  },
};
