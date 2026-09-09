import type { Meta, StoryObj } from "@storybook/react";
import { Funnel } from "./Funnel";

const meta: Meta<typeof Funnel> = {
  title: "Forsight/Data Viz/Funnel",
  component: Funnel,
  decorators: [
    (Story) => (
      <div className="w-full max-w-md p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Funnel>;

export const SignupFunnel: Story = {
  name: "Signup funnel",
  args: {
    stages: [
      { label: "Visited pricing page", value: 42_000 },
      { label: "Started signup", value: 18_900 },
      { label: "Verified email", value: 14_200 },
      { label: "Activated a project", value: 6_100 },
      { label: "Became a paying customer", value: 2_040 },
    ],
  },
};

export const DeploymentPipeline: Story = {
  name: "Deployment pipeline",
  args: {
    stages: [
      { label: "Commits pushed", value: 1_240 },
      { label: "CI passed", value: 1_180 },
      { label: "Staged", value: 1_150 },
      { label: "Promoted to production", value: 980 },
    ],
  },
};
