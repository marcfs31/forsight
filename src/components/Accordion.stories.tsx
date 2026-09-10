import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./Accordion";

const meta: Meta = {
  title: "Forsight/Data Display/Accordion",
};
export default meta;
type Story = StoryObj;

export const SingleOpen: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="billing" className="w-96">
      <AccordionItem value="billing">
        <AccordionTrigger>How does billing work?</AccordionTrigger>
        <AccordionContent>
          You're billed monthly based on your plan. Upgrades take effect immediately; downgrades
          apply next cycle.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="cancel">
        <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
        <AccordionContent>
          Yes — cancel from Settings and you'll keep access until the period ends.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="support">
        <AccordionTrigger>What support is included?</AccordionTrigger>
        <AccordionContent>
          Every plan includes email support; Pro adds priority response times.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** Real-browser interaction: a closed section opens on trigger click and its content becomes visible. */
export const OpensOnClick: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="a">
        <AccordionTrigger>How does billing work?</AccordionTrigger>
        <AccordionContent>Billed monthly by plan.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
        <AccordionContent>Yes, anytime from Settings.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "How does billing work?" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText("Billed monthly by plan.")).toBeVisible();
  },
};
