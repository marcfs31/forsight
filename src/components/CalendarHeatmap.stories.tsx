import type { Meta, StoryObj } from "@storybook/react";
import { CalendarHeatmap, type CalendarHeatmapDay } from "./CalendarHeatmap";

const meta: Meta<typeof CalendarHeatmap> = {
  title: "Fors/Data Viz/CalendarHeatmap",
  component: CalendarHeatmap,
};
export default meta;
type Story = StoryObj<typeof CalendarHeatmap>;

// Deterministic pseudo-random incident counts across ~3 months.
function generateDays(startISO: string, count: number): CalendarHeatmapDay[] {
  const start = new Date(`${startISO}T00:00:00Z`);
  let seed = 7;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + i);
    const roll = next();
    const value = roll > 0.85 ? Math.floor(roll * 6) : roll > 0.5 ? 1 : 0;
    return { date: date.toISOString().slice(0, 10), value };
  });
}

export const IncidentsPerDay: Story = {
  render: () => (
    <CalendarHeatmap
      label="Incidents per day, last 90 days"
      days={generateDays("2025-12-10", 90)}
    />
  ),
};

export const SingleWeek: Story = {
  render: () => (
    <CalendarHeatmap
      label="Deploys this week"
      days={[
        { date: "2026-03-02", value: 2 },
        { date: "2026-03-03", value: 0 },
        { date: "2026-03-04", value: 5 },
        { date: "2026-03-05", value: 1 },
        { date: "2026-03-06", value: 0 },
      ]}
    />
  ),
};
