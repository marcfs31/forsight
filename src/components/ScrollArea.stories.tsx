import type { Meta, StoryObj } from "@storybook/react";
import { expect, fireEvent, within } from "@storybook/test";
import { ScrollArea } from "./ScrollArea";

const meta: Meta<typeof ScrollArea> = {
  title: "Forsight/Data Display/ScrollArea",
  component: ScrollArea,
};
export default meta;
type Story = StoryObj<typeof ScrollArea>;

const RELEASES = Array.from(
  { length: 30 },
  (_, i) => `v1.${30 - i}.0 — routine maintenance release`
);

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-48 w-72 rounded-md border border-ink-border bg-ink-surface p-3">
      <ul className="flex flex-col gap-2 text-sm font-sans text-fg">
        {RELEASES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = canvas.getByText(RELEASES[0]).closest("[data-radix-scroll-area-viewport]");
    if (!viewport) throw new Error("viewport not found");
    expect(viewport.scrollTop).toBe(0);
    fireEvent.scroll(viewport, { target: { scrollTop: 80 } });
    await expect(viewport.scrollTop).toBe(80);
  },
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea
      orientation="horizontal"
      className="w-72 rounded-md border border-ink-border bg-ink-surface p-3"
    >
      <div className="flex w-max gap-3 text-sm font-sans text-fg">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-ink-surface-2"
          >
            Card {i + 1}
          </span>
        ))}
      </div>
    </ScrollArea>
  ),
};
