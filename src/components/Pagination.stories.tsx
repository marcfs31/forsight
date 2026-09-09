import type { Meta, StoryObj } from "@storybook/react";
import { Pagination, PaginationItem, PaginationEllipsis } from "./Pagination";
import { Button } from "./Button";

const meta: Meta = {
  title: "Forsight/Navigation/Pagination",
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Pagination>
      <Button variant="ghost" size="sm">
        Prev
      </Button>
      <PaginationItem active>1</PaginationItem>
      <PaginationItem>2</PaginationItem>
      <PaginationItem>3</PaginationItem>
      <PaginationEllipsis />
      <PaginationItem>12</PaginationItem>
      <Button variant="ghost" size="sm">
        Next
      </Button>
    </Pagination>
  ),
};
