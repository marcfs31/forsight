import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { JSONViewer } from "./JSONViewer";

const meta: Meta<typeof JSONViewer> = {
  title: "Fors/Data Display/JSONViewer",
  component: JSONViewer,
};
export default meta;
type Story = StoryObj<typeof JSONViewer>;

const SPAN_ATTRIBUTES = {
  service: "checkout-api",
  http: {
    method: "POST",
    status_code: 500,
    route: "/v1/checkout",
  },
  retry: false,
  tags: ["payments", "critical"],
  error: null,
};

export const SpanAttributes: Story = {
  render: () => <JSONViewer label="Span attributes" data={SPAN_ATTRIBUTES} />,
};

export const FullyExpanded: Story = {
  render: () => <JSONViewer label="Span attributes" data={SPAN_ATTRIBUTES} defaultDepth={10} />,
};

export const EmptyObject: Story = {
  render: () => <JSONViewer label="Metadata" data={{}} />,
};

/** Real-browser interaction: expanding a collapsed node reveals its children. */
export const ExpandCollapse: Story = {
  render: () => <JSONViewer label="Span attributes" data={SPAN_ATTRIBUTES} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const httpToggle = canvas.getByRole("button", { name: /http/ });
    expect(httpToggle).toHaveAttribute("aria-expanded", "false");
    expect(canvas.queryByText(/status_code/)).not.toBeInTheDocument();

    await userEvent.click(httpToggle);
    expect(httpToggle).toHaveAttribute("aria-expanded", "true");
    expect(canvas.getByText(/status_code/)).toBeInTheDocument();

    await userEvent.click(httpToggle);
    expect(httpToggle).toHaveAttribute("aria-expanded", "false");
    expect(canvas.queryByText(/status_code/)).not.toBeInTheDocument();
  },
};
