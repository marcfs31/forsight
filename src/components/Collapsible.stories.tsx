import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./Collapsible";
import { Button } from "./Button";
import { Text } from "./Text";

const meta: Meta = {
  title: "Forsight/Data Display/Collapsible",
};
export default meta;
type Story = StoryObj;

export const ShowMore: Story = {
  render: () => (
    <Collapsible className="w-80">
      <Text size="sm">Deploys trigger on every push to a connected branch.</Text>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-1 px-0">
          Show more
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Text size="sm" tone="secondary">
          You can restrict this to specific branches or pause automatic deploys entirely from the
          project's Git settings.
        </Text>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/** Real-browser interaction: closed by default, content appears on trigger click. */
export const OpensOnClick: Story = {
  render: () => (
    <Collapsible className="w-80">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm">
          Show advanced settings
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Text size="sm" tone="secondary">
          Advanced settings content.
        </Text>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Show advanced settings" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText("Advanced settings content.")).not.toBeInTheDocument();

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText("Advanced settings content.")).toBeVisible();
  },
};
