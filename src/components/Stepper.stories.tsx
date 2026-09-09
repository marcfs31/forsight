import type { Meta, StoryObj } from "@storybook/react";
import { Stepper } from "./Stepper";

const STEPS = [
  { label: "Account", description: "Create your login" },
  { label: "Team", description: "Invite teammates" },
  { label: "Billing", description: "Add a payment method" },
  { label: "Review" },
];

const meta: Meta<typeof Stepper> = {
  title: "Forsight/Feedback/Stepper",
  component: Stepper,
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Stepper>;

export const FirstStep: Story = {
  args: { label: "Setup progress", steps: STEPS, currentStep: 0 },
};

export const MiddleStep: Story = {
  args: { label: "Setup progress", steps: STEPS, currentStep: 2 },
};

export const LastStep: Story = {
  args: { label: "Setup progress", steps: STEPS, currentStep: 3 },
};
