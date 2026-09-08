import type { Meta, StoryObj } from "@storybook/react";
import { TraceWaterfall, type TraceSpan } from "./TraceWaterfall";

const spans: TraceSpan[] = [
  { id: "1", name: "POST /api/checkout", service: "edge", start: 0, duration: 1840 },
  { id: "2", name: "auth.verify", service: "identity", start: 12, duration: 96, depth: 1 },
  { id: "3", name: "cart.load", service: "checkout", start: 120, duration: 210, depth: 1 },
  { id: "4", name: "SELECT cart_items", service: "postgres", start: 140, duration: 172, depth: 2 },
  { id: "5", name: "pricing.quote", service: "pricing", start: 340, duration: 420, depth: 1 },
  { id: "6", name: "tax.calculate", service: "vendor-tax", start: 380, duration: 360, depth: 2 },
  {
    id: "7",
    name: "payment.charge",
    service: "payments",
    start: 780,
    duration: 980,
    depth: 1,
    status: "error",
  },
  {
    id: "8",
    name: "POST psp.charge",
    service: "vendor-psp",
    start: 820,
    duration: 900,
    depth: 2,
    status: "error",
  },
];

const meta: Meta<typeof TraceWaterfall> = {
  title: "Fors/Observability/TraceWaterfall",
  component: TraceWaterfall,
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof TraceWaterfall>;

export const FailingCheckout: Story = {
  name: "Failing checkout",
  args: { label: "POST /api/checkout — trace 9f2c41", spans },
};

export const HealthyRequest: Story = {
  name: "Healthy request",
  args: {
    label: "GET /api/search — trace 21ab77",
    spans: [
      { id: "1", name: "GET /api/search", service: "edge", start: 0, duration: 312 },
      { id: "2", name: "query.parse", service: "search", start: 4, duration: 18, depth: 1 },
      { id: "3", name: "index.search", service: "search", start: 26, duration: 240, depth: 1 },
      { id: "4", name: "results.rank", service: "search", start: 268, duration: 40, depth: 1 },
    ],
  },
};
