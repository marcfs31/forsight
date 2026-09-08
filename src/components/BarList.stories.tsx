import type { Meta, StoryObj } from "@storybook/react";
import { BarList } from "./BarList";
import { formatDuration } from "../lib/chart";

const meta: Meta<typeof BarList> = {
  title: "Fors/Data Viz/BarList",
  component: BarList,
  decorators: [
    (Story) => (
      <div className="w-full max-w-md p-4 sm:p-8">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof BarList>;

export const TopEndpoints: Story = {
  name: "Top endpoints",
  args: {
    items: [
      { label: "POST /api/checkout", value: 128_400 },
      { label: "GET /api/search", value: 96_210 },
      { label: "GET /api/products", value: 71_880 },
      { label: "POST /api/cart", value: 42_310 },
      { label: "GET /healthz", value: 12_040 },
    ],
  },
};

export const SlowestRoutes: Story = {
  name: "Slowest routes (drill-down)",
  args: {
    valueFormat: formatDuration,
    items: [
      { label: "POST /api/checkout", value: 1840, href: "#trace-checkout", seriesIndex: 0 },
      { label: "GET /api/search", value: 920, href: "#trace-search", seriesIndex: 1 },
      { label: "POST /api/cart", value: 410, href: "#trace-cart", seriesIndex: 2 },
    ],
  },
};
