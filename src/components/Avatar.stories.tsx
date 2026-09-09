import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarGroup } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Forsight/Data Display/Avatar",
  component: Avatar,
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {
  args: { initials: "MF", alt: "Marc Fors" },
};

export const WithImage: Story = {
  args: { src: "https://i.pravatar.cc/80?img=12", alt: "Team member", initials: "TM" },
};

export const BrokenImageFallsBackToInitials: Story = {
  args: { src: "https://invalid.example/does-not-exist.png", alt: "Team member", initials: "TM" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm" initials="SM" />
      <Avatar size="md" initials="MD" />
      <Avatar size="lg" initials="LG" />
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar initials="MF" alt="Marc Fors" />
      <Avatar initials="JD" alt="Jamie Doe" />
      <Avatar initials="AK" alt="Alex Kim" />
    </AvatarGroup>
  ),
};

export const GroupWithOverflow: Story = {
  render: () => (
    <AvatarGroup max={3}>
      <Avatar initials="MF" alt="Marc Fors" />
      <Avatar initials="JD" alt="Jamie Doe" />
      <Avatar initials="AK" alt="Alex Kim" />
      <Avatar initials="RL" alt="Robin Lee" />
      <Avatar initials="SP" alt="Sam Park" />
    </AvatarGroup>
  ),
};
