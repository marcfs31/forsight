import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { Gauge } from "./Gauge";

describe("Gauge", () => {
  it("exposes value, bounds and a readable value text as a meter", () => {
    render(<Gauge label="Error budget" value={62} caption="of 30-day budget" />);
    const meter = screen.getByRole("meter", { name: "Error budget" });
    expect(meter).toHaveAttribute("aria-valuenow", "62");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(meter).toHaveAttribute("aria-valuetext", "62 of 30-day budget");
  });

  it("prints the number and label, so the dial is never the only signal", () => {
    render(<Gauge label="Disk usage" value={81} tone="warning" />);
    expect(screen.getByText("81")).toBeInTheDocument();
    expect(screen.getByText("Disk usage")).toBeInTheDocument();
  });

  it("draws a track and, above zero, a value arc", () => {
    const { container } = render(<Gauge label="Usage" value={40} />);
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });

  it("draws only the track at zero", () => {
    const { container } = render(<Gauge label="Usage" value={0} />);
    expect(container.querySelectorAll("path")).toHaveLength(1);
  });

  it("clamps a reading outside its bounds instead of overdrawing the dial", () => {
    const { container } = render(<Gauge label="Usage" value={140} />);
    expect(container.querySelector("path[class*='fill-accent']")).toBeInTheDocument();
  });

  it("marks a target on the dial when one is given", () => {
    const { container } = render(<Gauge label="SLO" value={99.2} min={95} target={99.9} />);
    expect(container.querySelector("line")).toBeInTheDocument();
  });

  it("tolerates a collapsed range", () => {
    render(<Gauge label="Flat" value={5} min={5} max={5} />);
    expect(screen.getByRole("meter", { name: "Flat" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Gauge label="Error budget" value={62} caption="of 30-day budget" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
