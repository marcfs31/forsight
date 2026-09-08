import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { BarChart } from "./BarChart";

const labels = ["2xx", "3xx", "4xx", "5xx"];
const series = [
  { name: "checkout", values: [1200, 40, 90, 12] },
  { name: "search", values: [800, 20, 60, 4] },
];

describe("BarChart", () => {
  it("draws a bar per series per category", () => {
    const { container } = render(<BarChart label="Responses" labels={labels} series={series} />);
    // 4 categories x 2 series, each a path with a non-empty `d`.
    const bars = [...container.querySelectorAll("g > path")].filter((p) => p.getAttribute("d"));
    expect(bars).toHaveLength(8);
  });

  it("stacks segments and totals them in the readout", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BarChart label="Responses" labels={labels} series={series} stacked />
    );
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    plot.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent("2xx: checkout 1.2k, search 800");
  });

  it("omits the stacked total when there is only one series", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BarChart label="Responses" labels={labels} series={[series[0]]} stacked />
    );
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    plot.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
  });

  it("treats a missing sample as zero rather than a gap", () => {
    render(
      <BarChart
        label="Responses"
        labels={["2xx", "5xx"]}
        series={[{ name: "checkout", values: [10, null] }]}
      />
    );
    expect(screen.getByRole("cell", { name: "no data" })).toBeInTheDocument();
  });

  it("tracks a pointer to the band under it", () => {
    const { container } = render(<BarChart label="Responses" labels={labels} series={series} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    plot.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 600,
        height: 220,
        right: 600,
        bottom: 220,
        x: 0,
        y: 0,
      }) as DOMRect;

    fireEvent(plot, new MouseEvent("pointermove", { clientX: 500, bubbles: true }));
    expect(screen.getByRole("status")).toHaveTextContent("5xx");

    fireEvent.pointerLeave(plot);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("ignores a pointer event with no coordinates", () => {
    const { container } = render(<BarChart label="Responses" labels={labels} series={series} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    fireEvent.pointerMove(plot);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("renders with no data at all", () => {
    const { container } = render(<BarChart label="Nothing" labels={[]} series={[]} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    fireEvent(plot, new MouseEvent("pointermove", { clientX: 10, bubbles: true }));
    expect(screen.getByRole("img", { name: "Nothing" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <BarChart label="Responses" description="By status class" labels={labels} series={series} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
