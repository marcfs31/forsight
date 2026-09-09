import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

const meta: Meta<typeof EmptyState> = {
  title: "Forsight/Data Display/EmptyState",
  component: EmptyState,
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

const InboxIcon = (
  <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect x="6" y="12" width="28" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 14l14 10 14-10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export const TitleOnly: Story = {
  render: () => <EmptyState title="No deployments yet" />,
};

export const WithDescription: Story = {
  render: () => (
    <EmptyState
      icon={InboxIcon}
      title="No deployments yet"
      description="Deployments you push to this project will show up here."
    />
  ),
};

export const WithAction: Story = {
  render: () => (
    <EmptyState
      icon={InboxIcon}
      title="No results match your filters"
      description="Try widening your date range or clearing the service filter."
      action={<Button variant="secondary">Clear filters</Button>}
    />
  ),
};
