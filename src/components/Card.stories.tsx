import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";

const meta: Meta<typeof Card> = {
  title: "Forsight/Data Display/Card",
  component: Card,
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Rapids plan</CardTitle>
        <CardDescription>For teams shipping client work every week.</CardDescription>
      </CardHeader>
      <CardContent>Unlimited projects, custom branding, priority support.</CardContent>
      <CardFooter>
        <Button size="sm">Choose plan</Button>
        <Button size="sm" variant="ghost">
          Compare
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2">
          <CardTitle>Client portal</CardTitle>
          <Badge variant="success">Live</Badge>
        </div>
        <CardDescription>Deployed to forsight-client-portal.vercel.app</CardDescription>
      </CardHeader>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card interactive className="max-w-sm">
      <CardHeader>
        <CardTitle>Select a template</CardTitle>
        <CardDescription>Hover to see the interactive border highlight.</CardDescription>
      </CardHeader>
    </Card>
  ),
};
