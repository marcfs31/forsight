import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "./Alert";

const meta: Meta<typeof Alert> = {
  title: "Forsight/Feedback/Alert",
  component: Alert,
};
export default meta;
type Story = StoryObj<typeof Alert>;

export const Neutral: Story = {
  args: {
    variant: "neutral",
    title: "Heads up",
    children: "Deploys are paused during the migration window.",
  },
};

export const Accent: Story = {
  args: {
    variant: "accent",
    title: "New feature",
    children: "Custom domains are now available on the Rapids plan.",
  },
};

export const Success: Story = {
  args: { variant: "success", title: "Deployed", children: "Your changes are live in production." },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Approaching limit",
    children: "You've used 92% of this month's build minutes.",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    title: "Deploy failed",
    children: "Build exited with code 1 — check the deploy log for details.",
  },
};
