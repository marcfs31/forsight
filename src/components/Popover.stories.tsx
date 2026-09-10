import type { Meta, StoryObj } from "@storybook/react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover";
import { Button } from "./Button";
import { Input } from "./Input";

const meta: Meta = {
  title: "Forsight/Overlays/Popover",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const FilterForm: Story = {
  render: () => (
    <div className="flex h-64 items-start justify-center pt-12">
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="secondary">Filter</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Filter options">
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-1 font-sans text-sm font-medium text-fg">Branch</p>
              <Input aria-label="Branch" placeholder="main" />
            </div>
            <Button size="sm">Apply</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog", { name: "Filter options" });
    await expect(dialog).toHaveClass("max-w-[calc(100vw-2rem)]");
  },
};

/** Real-browser interaction: the panel opens from the trigger and closes on Escape. */
export const OpensOnClick: Story = {
  render: () => (
    <div className="flex h-64 items-start justify-center pt-12">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary">Filter</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Filter options">Filter form</PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Filter" }));
    const dialog = await screen.findByRole("dialog", { name: "Filter options" });
    await expect(dialog).toHaveTextContent("Filter form");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  },
};
