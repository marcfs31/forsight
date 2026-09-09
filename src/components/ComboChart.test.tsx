import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { ComboChart, type ComboChartSeries } from "./ComboChart";

const labels = ["12:00", "13:00", "14:00"];
const series: ComboChartSeries[] = [
  { name: "Requests", type: "bar", values: [1200, 1800, 1400] },
  { name: "p99 latency", type: "line", values: [180, 340, 190] },
];

describe("ComboChart", () => {
  it("draws a bar per category for the bar series and one line for the line series", () => {
    const { container } = render(<ComboChart label="Traffic" labels={labels} series={series} />);
    // Bars have no stroke-linecap (plain fill paths); the line path does.
    const barPaths = [...container.querySelectorAll("g > path")].filter(
      (p) => p.getAttribute("d") && !p.hasAttribute("stroke-linecap")
    );
    expect(barPaths).toHaveLength(3);
    const linePaths = container.querySelectorAll("path[stroke-linecap='round']");
    expect(linePaths).toHaveLength(1);
  });

  it("splits the line at a null sample", () => {
    const { container } = render(
      <ComboChart
        label="Traffic"
        labels={labels}
        series={[series[0], { name: "p99 latency", type: "line", values: [180, null, 190] }]}
      />
    );
    const linePaths = container.querySelectorAll("path[stroke-linecap='round']");
    expect(linePaths).toHaveLength(2);
  });

  it("notes which axis each series reads on when both types are present", () => {
    render(<ComboChart label="Traffic" labels={labels} series={series} />);
    // Both the SVG <desc> and the sr-only table <caption> carry it.
    expect(
      screen.getAllByText(/Requests use the left axis; p99 latency use the right axis\./)
    ).toHaveLength(2);
  });

  it("reads every series at the focused category via arrow keys", async () => {
    const user = userEvent.setup();
    const { container } = render(<ComboChart label="Traffic" labels={labels} series={series} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    plot.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent("12:00: Requests 1.2k, p99 latency 180");
  });

  it("shows 'no data' for a null sample in the readout and table", async () => {
    const user = userEvent.setup();
    render(
      <ComboChart
        label="Traffic"
        labels={labels}
        series={[series[0], { name: "p99 latency", type: "line", values: [null, 340, 190] }]}
      />
    );
    expect(screen.getAllByRole("cell", { name: "no data" })).toHaveLength(1);
    const plot = screen
      .getByRole("img", { name: "Traffic" })
      .closest("[tabindex='0']") as HTMLElement;
    plot.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent(
      "12:00: Requests 1.2k, p99 latency no data"
    );
  });

  it("tracks a pointer to the category under it", () => {
    const { container } = render(<ComboChart label="Traffic" labels={labels} series={series} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    plot.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 600,
        height: 240,
        right: 600,
        bottom: 240,
        x: 0,
        y: 0,
      }) as DOMRect;

    fireEvent(plot, new MouseEvent("pointermove", { clientX: 500, bubbles: true }));
    expect(screen.getByRole("status")).toHaveTextContent("14:00");

    fireEvent.pointerLeave(plot);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("shows the legend once more than one series is present", () => {
    const { container } = render(<ComboChart label="Traffic" labels={labels} series={series} />);
    const legend = within(container.querySelector("ul") as HTMLElement);
    expect(legend.getByText("Requests")).toBeInTheDocument();
    expect(legend.getByText("p99 latency")).toBeInTheDocument();
  });

  it("renders with no data at all", () => {
    const { container } = render(<ComboChart label="Nothing" labels={[]} series={[]} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    fireEvent(plot, new MouseEvent("pointermove", { clientX: 10, bubbles: true }));
    expect(screen.getByRole("img", { name: "Nothing" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ComboChart label="Traffic" description="By hour" labels={labels} series={series} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
