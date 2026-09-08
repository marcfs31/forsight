import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { BoxPlot } from "./BoxPlot";

const boxes = [
  { label: "checkout", min: 40, q1: 80, median: 120, q3: 180, max: 420 },
  { label: "search", min: 20, q1: 35, median: 50, q3: 70, max: 160 },
];

describe("BoxPlot", () => {
  it("draws a whisker line and a box per category", () => {
    const { container } = render(<BoxPlot label="Latency" boxes={boxes} />);
    expect(container.querySelectorAll("rect")).toHaveLength(2);
  });

  it("renders the five-number summary in the data table", () => {
    render(<BoxPlot label="Latency" boxes={boxes} />);
    expect(screen.getByRole("columnheader", { name: "Median" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "120" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "420" })).toBeInTheDocument();
  });

  it("reads the focused box's full summary via arrow keys", async () => {
    const user = userEvent.setup();
    const { container } = render(<BoxPlot label="Latency" boxes={boxes} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    plot.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent(
      "checkout: median 120, Q1 80, Q3 180, min 40, max 420"
    );
  });

  it("tracks a pointer to the box under it", () => {
    const { container } = render(<BoxPlot label="Latency" boxes={boxes} />);
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
    expect(screen.getByRole("status")).toHaveTextContent("search");

    fireEvent.pointerLeave(plot);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("scales to the data range rather than a zero baseline", () => {
    // A category far from zero (e.g. p95 latency in the 1000-1400ms range)
    // should never produce a "0" tick — that would mean the axis is
    // wrongly zero-baselined, like BarChart's, rather than fit to the data
    // like LineChart's.
    render(
      <BoxPlot
        label="Latency"
        boxes={[{ label: "checkout", min: 1000, q1: 1100, median: 1200, q3: 1300, max: 1400 }]}
      />
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders with no boxes at all", () => {
    const { container } = render(<BoxPlot label="Nothing" boxes={[]} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    fireEvent(plot, new MouseEvent("pointermove", { clientX: 10, bubbles: true }));
    expect(screen.getByRole("img", { name: "Nothing" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <BoxPlot label="Latency" description="By service" boxes={boxes} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
