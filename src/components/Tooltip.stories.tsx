import type { Meta, StoryObj } from "@storybook/react";
import { expect, screen } from "@storybook/test";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./Tooltip";
import { Button } from "./Button";

const meta: Meta = {
  title: "Forsight/Overlays/Tooltip",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="flex h-40 items-center justify-center">
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="ghost">Redeploy</Button>
          </TooltipTrigger>
          <TooltipContent>Rebuilds from the last successful commit</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ),
  play: async () => {
    // Radix renders the visible tip plus a visually-hidden copy for SR — both count.
    const tips = await screen.findAllByText("Rebuilds from the last successful commit");
    await expect(tips.length).toBeGreaterThan(0);
  },
};
