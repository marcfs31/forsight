import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { ChartFrame } from "./ChartFrame";
import { ChartLegend } from "./ChartLegend";
import { ChartTooltip } from "./ChartTooltip";

const rows = [
  { header: "us-east", cells: ["12", "18"] },
  { header: "eu-west", cells: ["9", "7"] },
];

describe("ChartFrame", () => {
  it("names the plot as an image and describes it", () => {
    render(
      <ChartFrame label="Requests" description="Last hour" columns={["12:00", "13:00"]} rows={rows}>
        {() => <rect width="10" height="10" />}
      </ChartFrame>
    );
    const plot = screen.getByRole("img", { name: "Requests" });
    expect(plot).toHaveAccessibleDescription("Last hour");
  });

  it("hands the mark renderer a measured box", () => {
    const draw = vi.fn(() => null);
    render(
      <ChartFrame label="Requests" columns={[]} rows={[]} height={140}>
        {draw}
      </ChartFrame>
    );
    expect(draw).toHaveBeenCalledWith({ width: expect.any(Number), height: 140 });
  });

  it("publishes the same data as a table", () => {
    render(
      <ChartFrame label="Requests" columns={["12:00", "13:00"]} rows={rows}>
        {() => null}
      </ChartFrame>
    );
    expect(screen.getByRole("columnheader", { name: "13:00" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "us-east" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ChartFrame label="Requests" description="Last hour" columns={["12:00"]} rows={[rows[0]]}>
        {() => null}
      </ChartFrame>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ChartLegend", () => {
  it("labels each series with text, not color alone", () => {
    render(
      <ChartLegend
        items={[{ label: "us-east", seriesIndex: 0, value: "62%" }, { label: "Other" }]}
      />
    );
    expect(screen.getByText("us-east")).toBeInTheDocument();
    expect(screen.getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ChartLegend items={[{ label: "us-east", seriesIndex: 0 }]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ChartTooltip", () => {
  it("is hidden from assistive tech — the live region and table carry the data", () => {
    const { container } = render(
      <ChartTooltip title="13:00" rows={[{ label: "us-east", value: "18", seriesIndex: 0 }]} />
    );
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("18")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ChartTooltip title="13:00" rows={[{ label: "us-east", value: "18" }]} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
