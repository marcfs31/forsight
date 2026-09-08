import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { DonutChart } from "./DonutChart";

const data = [
  { name: "us-east", value: 60 },
  { name: "eu-west", value: 30 },
  { name: "ap-south", value: 10 },
];

describe("DonutChart", () => {
  it("draws one arc per slice and totals them in the middle", () => {
    const { container } = render(<DonutChart label="Traffic by region" data={data} />);
    expect(container.querySelectorAll("path")).toHaveLength(3);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("prints each slice's share in the legend so angles never have to be judged", () => {
    render(<DonutChart label="Traffic by region" data={data} />);
    expect(screen.getByRole("list")).toHaveTextContent("60%");
    expect(screen.getByRole("list")).toHaveTextContent("10%");
  });

  it("takes an explicit center value and caption", () => {
    render(<DonutChart label="Traffic" data={data} centerValue="1.2M" centerLabel="requests" />);
    expect(screen.getByText("1.2M")).toBeInTheDocument();
    expect(screen.getByText("requests")).toBeInTheDocument();
  });

  it("shows an empty ring rather than dividing by zero", () => {
    const { container } = render(
      <DonutChart label="Traffic" data={[{ name: "none", value: 0 }]} />
    );
    expect(container.querySelector("circle")).toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveTextContent("0%");
  });

  it("reads a slice out on hover", () => {
    const { container } = render(<DonutChart label="Traffic" data={data} />);
    const slice = container.querySelector("path") as SVGPathElement;

    fireEvent.pointerEnter(slice);
    expect(screen.getByRole("status")).toHaveTextContent("us-east: 60, 60% of total");

    fireEvent.pointerLeave(slice);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("walks the slices with the keyboard", async () => {
    const user = userEvent.setup();
    const { container } = render(<DonutChart label="Traffic" data={data} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;

    plot.focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("status")).toHaveTextContent("ap-south");
    // The center swaps from the total to the focused slice's share.
    expect(container.querySelector("svg text")).toHaveTextContent("10%");
  });

  it("publishes value and share as a table", () => {
    render(<DonutChart label="Traffic" data={data} />);
    expect(screen.getByRole("columnheader", { name: "Share" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "eu-west" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <DonutChart label="Traffic by region" description="Last 24h" data={data} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
