import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";
import { Card, CardHeader, CardContent } from "./Card";

const meta: Meta<typeof Skeleton> = {
  title: "Forsight/Feedback/Skeleton",
  component: Skeleton,
};
export default meta;
type Story = StoryObj<typeof Skeleton>;

export const TextLine: Story = { args: { className: "h-4 w-48" } };
export const Avatar: Story = { args: { className: "h-10 w-10 rounded-full" } };

export const CardPlaceholder: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader className="flex-row items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </CardContent>
    </Card>
  ),
};
