import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "@storybook/test";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./AlertDialog";
import { Button } from "./Button";

const meta: Meta = {
  title: "Forsight/Overlays/AlertDialog",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const DeleteConfirmation: Story = {
  render: () => (
    <div className="flex h-96 items-center justify-center">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button variant="danger">Delete project</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project, its deployments, and its environment variables.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
};

export const NonDestructiveConfirmation: Story = {
  render: () => (
    <div className="flex h-96 items-center justify-center">
      <AlertDialog defaultOpen>
        <AlertDialogTrigger asChild>
          <Button>Publish changes</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish to production?</AlertDialogTitle>
            <AlertDialogDescription>
              This makes the current draft visible to all users immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="primary">Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
};

/**
 * Real-browser interaction: opens from the trigger, focus lands on Cancel
 * (the safe default per Radix's alert-dialog `onOpenAutoFocus` override),
 * then closes via Escape — same effect as clicking Cancel.
 */
export const RequiresExplicitChoice: Story = {
  render: () => (
    <div className="flex h-96 items-center justify-center">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="danger">Revoke access</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API access?</AlertDialogTitle>
            <AlertDialogDescription>
              Any integration using this token stops working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Revoke access" }));

    const dialog = await within(document.body).findByRole("alertdialog");
    await expect(dialog).toHaveAccessibleName("Revoke API access?");
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus()
    );

    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument()
    );
  },
};
