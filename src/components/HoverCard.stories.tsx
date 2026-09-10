import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "./HoverCard";
import { Avatar } from "./Avatar";
import { StatusDot } from "./StatusDot";
import { Text } from "./Text";

const meta: Meta = {
  title: "Forsight/Overlays/HoverCard",
  parameters: { layout: "centered" },
};
export default meta;
type Story = StoryObj;

export const UserPreview: Story = {
  render: () => (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="rounded-full focus-visible:outline-none focus-visible:shadow-focus-ring"
        >
          <Avatar initials="MF" alt="Marc Fors" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex items-center gap-3">
          <Avatar initials="MF" alt="Marc Fors" size="lg" />
          <div>
            <p className="font-heading text-sm font-semibold text-fg">Marc Fors</p>
            <Text tone="secondary">On call this week</Text>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const ServiceHealthPreview: Story = {
  render: () => (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="rounded-sm text-sm font-sans text-fg underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:shadow-focus-ring"
        >
          checkout-api
        </button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-2">
          <StatusDot status="degraded" />
          <Text tone="secondary">p99 latency up 40% over the last hour.</Text>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

/**
 * Real-browser interaction: opens on hover (not click) and can be reached
 * by keyboard focus too — jsdom can't simulate hover reliably, so this
 * runs only in the Storybook test runner.
 */
export const OpensOnHoverAndFocus: Story = {
  render: () => (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <button type="button" className="text-sm font-sans text-fg underline">
          checkout-api
        </button>
      </HoverCardTrigger>
      <HoverCardContent>
        <Text tone="secondary">p99 latency up 40% over the last hour.</Text>
      </HoverCardContent>
    </HoverCard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "checkout-api" });

    trigger.focus();
    await waitFor(() => expect(within(document.body).getByText(/p99 latency/)).toBeInTheDocument());

    trigger.blur();
    await waitFor(() =>
      expect(within(document.body).queryByText(/p99 latency/)).not.toBeInTheDocument()
    );

    await userEvent.hover(trigger);
    await waitFor(() => expect(within(document.body).getByText(/p99 latency/)).toBeInTheDocument());
  },
};
