import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";

const meta: Meta = {
  title: "Forsight/Forms/RadioGroup",
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="hobby" className="flex flex-col gap-2">
      {[
        ["hobby", "Hobby — free"],
        ["pro", "Pro — $29/month"],
        ["enterprise", "Enterprise — custom pricing"],
      ].map(([value, label]) => (
        <div key={value} className="flex items-center gap-2">
          <RadioGroupItem value={value} id={value} />
          <label htmlFor={value} className="font-sans text-sm text-fg">
            {label}
          </label>
        </div>
      ))}
    </RadioGroup>
  ),
};
