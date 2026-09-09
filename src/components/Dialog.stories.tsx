import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "@storybook/test";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./Dialog";
import { Button } from "./Button";

const meta: Meta = {
  title: "Forsight/Overlays/Dialog",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const Confirmation: Story = {
  render: () => (
    <div className="flex h-96 items-center justify-center">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button variant="danger">Delete project</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this project?</DialogTitle>
            <DialogDescription>
              This permanently removes the project, its deployments, and its environment variables.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant="danger">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
};

export const FormDialog: Story = {
  render: () => (
    <div className="flex h-96 items-center justify-center">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>New project</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a project</DialogTitle>
            <DialogDescription>Name it something your team will recognize.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
};

/**
 * Real-browser interaction: opens from the trigger, traps focus in the
 * dialog, and closes on the Cancel button — covering the open/close cycle
 * jsdom can't drive reliably.
 */
export const OpenAndClose: Story = {
  render: () => (
    <div className="flex h-96 items-center justify-center">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="danger">Delete project</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this project?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Delete project" }));

    const dialog = await within(document.body).findByRole("dialog");
    await expect(dialog).toHaveAccessibleName("Delete this project?");

    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    await userEvent.click(cancel);
    await waitFor(() =>
      expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument()
    );
  },
};
