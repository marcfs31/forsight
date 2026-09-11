import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./DropdownMenu";
import { Button } from "./Button";

const meta: Meta = {
  title: "Forsight/Overlays/DropdownMenu",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const ProjectActions: Story = {
  // Shown open for visual review. Radix correctly sets `aria-hidden` on the
  // rest of the page (incl. #storybook-root) while a menu is open, which
  // axe's `aria-hidden-focus` rule flags as a static-snapshot false positive
  // against that focus-trap pattern — the KeyboardSelect play test below
  // exercises the open menu properly.
  parameters: { a11y: { options: { rules: { "aria-hidden-focus": { enabled: false } } } } },
  render: () => (
    <div className="flex h-64 items-start justify-center pt-12">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" aria-label="Project actions">
            ⋯
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem>Transfer ownership</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="danger">Delete project</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async () => {
    const menu = await screen.findByRole("menu");
    await expect(menu).toHaveClass("max-w-[calc(100vw-2rem)]");
  },
};

function KeyboardMenu() {
  const [picked, setPicked] = React.useState("");
  return (
    <div className="flex h-64 flex-col items-center gap-3 pt-12">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setPicked("rename")}>Rename</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPicked("duplicate")}>Duplicate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <output data-testid="picked">{picked}</output>
    </div>
  );
}

/**
 * Real-browser interaction: opens on Enter from the trigger, moves with
 * ArrowDown, fires `onSelect` on Enter.
 */
export const KeyboardSelect: Story = {
  render: () => <KeyboardMenu />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole("button", { name: "Actions" }).focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("menuitem", { name: "Rename" });
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(canvas.getByTestId("picked")).toHaveTextContent("duplicate");
    // Selecting closes the menu, and Radix clears the `aria-hidden` it puts on
    // the rest of the page as part of that unmount. Wait for the menu to
    // actually leave the DOM so the a11y pass that runs after this play
    // function measures the settled state — mid-teardown it would still see
    // focusable content inside an `aria-hidden` container and flag
    // `aria-hidden-focus`.
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  },
};
