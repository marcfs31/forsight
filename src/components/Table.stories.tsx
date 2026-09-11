import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./Table";
import { Badge } from "./Badge";

const meta: Meta = {
  title: "Forsight/Data Display/Table",
};
export default meta;
type Story = StoryObj;

const deployments = [
  { project: "forsight-client-portal", branch: "main", status: "success", when: "2m ago" },
  { project: "habit-tracker", branch: "feature/calendar", status: "building", when: "8m ago" },
  { project: "internal-crm", branch: "main", status: "failed", when: "1h ago" },
];

export const Deployments: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Branch</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Deployed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deployments.map((d) => (
          <TableRow key={d.project}>
            <TableCell>{d.project}</TableCell>
            <TableCell className="text-fg-secondary">{d.branch}</TableCell>
            <TableCell>
              <Badge
                variant={
                  d.status === "success" ? "success" : d.status === "failed" ? "danger" : "warning"
                }
              >
                {d.status}
              </Badge>
            </TableCell>
            <TableCell className="text-fg-muted">{d.when}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

const sortableDeployments = [
  { project: "forsight-client-portal", when: "2m ago", whenMinutes: 2 },
  { project: "habit-tracker", when: "8m ago", whenMinutes: 8 },
  { project: "internal-crm", when: "1h ago", whenMinutes: 60 },
];

function SortableExample() {
  const [direction, setDirection] = React.useState<"ascending" | "descending">("ascending");
  const rows = [...sortableDeployments].sort((a, b) =>
    direction === "ascending" ? a.whenMinutes - b.whenMinutes : b.whenMinutes - a.whenMinutes
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead
            sortDirection={direction}
            onSort={() => setDirection((d) => (d === "ascending" ? "descending" : "ascending"))}
          >
            Deployed
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((d) => (
          <TableRow key={d.project}>
            <TableCell>{d.project}</TableCell>
            <TableCell className="text-fg-muted">{d.when}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * `TableHead` only renders and announces the sort state — the actual
 * reordering here is this story's own `useState` + `Array.prototype.sort`,
 * per this file's "no sorting logic" scope note (compose with a headless
 * table library for anything more elaborate than this).
 */
export const Sortable: Story = {
  render: () => <SortableExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvas.getByRole("columnheader", { name: "Deployed" });
    expect(header).toHaveAttribute("aria-sort", "ascending");
    let cells = canvas.getAllByRole("cell", { name: /ago/ });
    expect(cells.map((c) => c.textContent)).toEqual(["2m ago", "8m ago", "1h ago"]);

    await userEvent.click(canvas.getByRole("button", { name: "Deployed" }));

    expect(header).toHaveAttribute("aria-sort", "descending");
    cells = canvas.getAllByRole("cell", { name: /ago/ });
    expect(cells.map((c) => c.textContent)).toEqual(["1h ago", "8m ago", "2m ago"]);
  },
};
