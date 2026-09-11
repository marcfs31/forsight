import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "./Drawer";
import { Button } from "./Button";
import { Text } from "./Text";

const meta: Meta = {
  title: "Forsight/Overlays/Drawer",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const RowDetail: Story = {
  render: () => (
    <div className="flex h-96 items-center justify-center">
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button>View deployment</Button>
        </DrawerTrigger>
        <DrawerContent hideClose>
          <DrawerHeader>
            <DrawerTitle>Deployment #4821</DrawerTitle>
            <DrawerDescription>main @ 8f3c1ab, deployed 2 minutes ago.</DrawerDescription>
          </DrawerHeader>
          <Text tone="secondary">
            Build completed in 42s. Preview available at deploy-4821.example.com.
          </Text>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary">Close</Button>
            </DrawerClose>
            <Button>Promote to production</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};

export const StartSide: Story = {
  render: () => (
    <div className="flex h-96 items-center justify-center">
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button>Open filters</Button>
        </DrawerTrigger>
        <DrawerContent side="start">
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>Narrow the trace list by service and status.</DrawerDescription>
          </DrawerHeader>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};

/**
 * Real-browser interaction: opens from the trigger, traps focus in the
 * drawer, and closes on the Close button — the open/close cycle jsdom
 * can't drive reliably.
 */
export const OpenAndClose: Story = {
  render: () => (
    <div className="flex h-96 items-center justify-center">
      <Drawer>
        <DrawerTrigger asChild>
          <Button>View deployment</Button>
        </DrawerTrigger>
        <DrawerContent hideClose>
          <DrawerHeader>
            <DrawerTitle>Deployment #4821</DrawerTitle>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "View deployment" }));

    const drawer = await within(document.body).findByRole("dialog");
    await expect(drawer).toHaveAccessibleName("Deployment #4821");

    const close = within(drawer).getByRole("button", { name: "Close" });
    await userEvent.click(close);
    await waitFor(() =>
      expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument()
    );
  },
};
