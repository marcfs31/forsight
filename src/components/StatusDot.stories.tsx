import type { Meta, StoryObj } from "@storybook/react";
import { StatusDot, STATUS_LABELS, type ServiceStatus } from "./StatusDot";

const meta: Meta<typeof StatusDot> = {
  title: "Forsight/Observability/StatusDot",
  component: StatusDot,
  decorators: [
    (Story) => (
      <div className="p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof StatusDot>;

export const AllStatuses: Story = {
  name: "All statuses",
  render: () => (
    <ul className="flex flex-col gap-2">
      {(Object.keys(STATUS_LABELS) as ServiceStatus[]).map((status) => (
        <li key={status}>
          <StatusDot status={status} />
        </li>
      ))}
    </ul>
  ),
};

export const Live: Story = {
  name: "Live incident",
  args: { status: "outage", label: "checkout-api is down", pulse: true },
};

export const DotOnly: Story = {
  name: "Dot only (dense table cell)",
  args: { status: "operational", label: null },
};
