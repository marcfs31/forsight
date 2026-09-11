import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
  title: "Forsight/Forms/Switch",
  component: Switch,
  // Radix Switch renders a <button role="switch"> with no text — it always
  // needs an accessible name: an `aria-label`, or a `<label htmlFor>` bound
  // to its `id` (see the WithLabel story).
  args: { "aria-label": "Preview deployments" },
};
export default meta;
type Story = StoryObj<typeof Switch>;

export const Off: Story = { args: {} };
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="marketing" defaultChecked />
      <label htmlFor="marketing" className="font-sans text-sm text-fg">
        Send me product updates
      </label>
    </div>
  ),
};

/**
 * Real-browser interaction: the thumb's `translateX` is a physical pixel
 * offset (Tailwind has no logical translate utility), so it needs its own
 * `rtl:`/`ltr:`-scoped value rather than one direction falling through as a
 * default — a sign error here would silently pass every other check while
 * being visibly backwards. Verified via actual geometry (bounding rects),
 * not `toHaveClass` — both direction's classes are always present in the
 * DOM regardless of which one's CSS actually wins, so only rendered
 * position proves the fix works.
 */
export const RTL: Story = {
  render: () => (
    <div className="flex gap-10">
      <div dir="ltr" className="flex flex-col items-center gap-2">
        <span className="font-sans text-xs text-fg-muted">LTR</span>
        <Switch aria-label="LTR preview" defaultChecked />
      </div>
      <div dir="rtl" className="flex flex-col items-center gap-2">
        <span className="font-sans text-xs text-fg-muted">RTL</span>
        <Switch aria-label="RTL preview" defaultChecked />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ltrTrack = canvas.getByRole("switch", { name: "LTR preview" });
    const rtlTrack = canvas.getByRole("switch", { name: "RTL preview" });
    const ltrThumb = ltrTrack.querySelector("span");
    const rtlThumb = rtlTrack.querySelector("span");
    if (!ltrThumb || !rtlThumb) throw new Error("Switch thumb not found");

    const ltrTrackRect = ltrTrack.getBoundingClientRect();
    const ltrThumbRect = ltrThumb.getBoundingClientRect();
    const rtlTrackRect = rtlTrack.getBoundingClientRect();
    const rtlThumbRect = rtlThumb.getBoundingClientRect();

    // Checked = thumb at the logical end: the right half of the track in
    // LTR, the left half in RTL.
    await expect(ltrThumbRect.left + ltrThumbRect.width / 2).toBeGreaterThan(
      ltrTrackRect.left + ltrTrackRect.width / 2
    );
    await expect(rtlThumbRect.left + rtlThumbRect.width / 2).toBeLessThan(
      rtlTrackRect.left + rtlTrackRect.width / 2
    );
  },
};
