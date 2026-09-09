import type { Meta, StoryObj } from "@storybook/react";
import { ErrorBudget } from "./ErrorBudget";

const meta: Meta<typeof ErrorBudget> = {
  title: "Forsight/Observability/ErrorBudget",
  component: ErrorBudget,
};
export default meta;
type Story = StoryObj<typeof ErrorBudget>;

export const Healthy: Story = {
  render: () => (
    <div className="w-72">
      <ErrorBudget
        label="30-day error budget, checkout-api"
        consumed={22}
        caption="Resets in 8 days"
      />
    </div>
  ),
};

export const AtRisk: Story = {
  render: () => (
    <div className="w-72">
      <ErrorBudget
        label="30-day error budget, search-api"
        consumed={78}
        caption="Resets in 3 days"
      />
    </div>
  ),
};

export const Critical: Story = {
  render: () => (
    <div className="w-72">
      <ErrorBudget
        label="30-day error budget, payments-api"
        consumed={95}
        caption="Resets in 1 day"
      />
    </div>
  ),
};

export const CustomThresholds: Story = {
  render: () => (
    <div className="w-72">
      <ErrorBudget
        label="7-day error budget, worker-queue"
        consumed={55}
        warningAt={50}
        dangerAt={80}
        caption="Resets in 2 days"
      />
    </div>
  ),
};
