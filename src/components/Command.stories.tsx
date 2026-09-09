import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, screen, userEvent, within } from "@storybook/test";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "./Command";

const meta: Meta = {
  title: "Forsight/Overlays/Command",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  // cmdk's `CommandSeparator` renders `role="separator"` as a direct child of
  // `CommandList`'s `role="listbox"`, which axe's `aria-required-children`
  // rule doesn't allow (listbox only permits option/group children). This is
  // cmdk's own built-in, widely-used group-divider pattern — see
  // `Command.test.tsx` for the same rule exception with fuller reasoning.
  parameters: { a11y: { options: { rules: { "aria-required-children": { enabled: false } } } } },
  render: () => (
    <div className="flex justify-center pt-12">
      <Command label="Example commands" className="w-full max-w-md">
        <CommandInput placeholder="Search commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>New project</CommandItem>
            <CommandItem>New file</CommandItem>
            <CommandItem>Invite teammate</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem>Profile</CommandItem>
            <CommandItem>Billing</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
};

export const WithDialog: Story = {
  // Shown open for visual review. See DropdownMenu's `ProjectActions` story
  // for why a static-snapshot axe scan misreads Radix's legitimate
  // `aria-hidden` focus-trap on the rest of the page while a modal is open.
  parameters: { a11y: { options: { rules: { "aria-hidden-focus": { enabled: false } } } } },
  render: () => (
    <CommandDialog defaultOpen label="Quick actions" description="Search for an action to run.">
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem>Create new document</CommandItem>
          <CommandItem>Open recent file</CommandItem>
          <CommandItem>Share this project</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  ),
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    await expect(dialog).toHaveClass("max-w-lg");
    await expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  },
};

function FilterableCommand() {
  const [picked, setPicked] = React.useState("");
  return (
    <div className="flex flex-col items-center gap-3 pt-12">
      <Command label="Filterable commands" className="w-full max-w-md">
        <CommandInput placeholder="Search commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => setPicked("apple")}>Apple pie</CommandItem>
            <CommandItem onSelect={() => setPicked("banana")}>Banana split</CommandItem>
            <CommandItem onSelect={() => setPicked("cherry")}>Cherry tart</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <output data-testid="picked">{picked}</output>
    </div>
  );
}

/**
 * Real-browser interaction: typing filters the list live, arrow keys move
 * the active item, Enter fires `onSelect`.
 */
export const Filtering: Story = {
  render: () => <FilterableCommand />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Search commands...");
    await userEvent.type(input, "ban");
    await expect(canvas.queryByText("Apple pie")).not.toBeInTheDocument();
    await expect(canvas.getByText("Banana split")).toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByTestId("picked")).toHaveTextContent("banana");
  },
};

export const DisabledItems: Story = {
  render: () => (
    <div className="flex justify-center pt-12">
      <Command label="Commands with a disabled item" className="w-full max-w-md">
        <CommandInput placeholder="Search commands..." />
        <CommandList>
          <CommandGroup heading="Plan">
            <CommandItem>Upgrade plan</CommandItem>
            <CommandItem disabled>Cancel plan (contact support)</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disabledItem = canvas
      .getByText("Cancel plan (contact support)")
      .closest('[cmdk-item=""]');
    await expect(disabledItem).toHaveAttribute("aria-disabled", "true");
  },
};
