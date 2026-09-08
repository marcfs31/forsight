import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { Heatmap } from "./Heatmap";

const columns = ["00", "01", "02"];
const rows = [
  { label: "checkout", values: [0, 12, 40] },
  { label: "search", values: [4, null, 8] },
];

describe("Heatmap", () => {
  it("renders a real table with row and column headers", () => {
    render(<Heatmap label="Errors by service and hour" columns={columns} rows={rows} />);
    expect(screen.getByRole("columnheader", { name: "01" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "checkout" })).toBeInTheDocument();
    expect(screen.getAllByRole("cell")).toHaveLength(6);
  });

  it("gives every cell a readable value, including gaps", () => {
    render(<Heatmap label="Errors" columns={columns} rows={rows} />);
    expect(screen.getByRole("cell", { name: "no data" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "40" })).toBeInTheDocument();
  });

  it("darkens one hue with magnitude and leaves zero unpainted", () => {
    const { container } = render(<Heatmap label="Errors" columns={columns} rows={rows} />);
    const fills = [...container.querySelectorAll("td span[aria-hidden='true']")].map((node) =>
      node.getAttribute("class")
    );
    expect(fills[0]).toContain("opacity-0");
    expect(fills[2]).toContain("opacity-100");
    expect(fills.every((cls) => cls?.includes("bg-accent"))).toBe(true);
  });

  it("scales against an explicit ceiling when one is given", () => {
    const { container } = render(
      <Heatmap label="Errors" columns={columns} rows={[rows[0]]} max={400} />
    );
    const fills = [...container.querySelectorAll("td span[aria-hidden='true']")].map((node) =>
      node.getAttribute("class")
    );
    expect(fills[2]).toContain("opacity-15");
  });

  it("survives an all-zero matrix", () => {
    const { container } = render(
      <Heatmap label="Errors" columns={["00"]} rows={[{ label: "idle", values: [0] }]} />
    );
    expect(container.querySelector("td span[aria-hidden='true']")?.getAttribute("class")).toContain(
      "opacity-0"
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Heatmap label="Errors" columns={columns} rows={rows} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
