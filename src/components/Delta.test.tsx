import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { Delta } from "./Delta";

describe("Delta", () => {
  it("signs the value and names the direction for screen readers", () => {
    render(<Delta value={12.4} />);
    expect(screen.getByText("+12.4%")).toBeInTheDocument();
    expect(screen.getByText("increase")).toBeInTheDocument();
  });

  it("uses a real minus sign for a decrease", () => {
    render(<Delta value={-8.25} />);
    expect(screen.getByText("−8.3%")).toBeInTheDocument();
    expect(screen.getByText("decrease")).toBeInTheDocument();
  });

  it("colors by whether the move is good, not by its sign", () => {
    const { container: up } = render(<Delta value={30} goodDirection="down" />);
    expect(up.firstElementChild?.getAttribute("class")).toContain("text-danger");

    const { container: down } = render(<Delta value={-30} goodDirection="down" />);
    expect(down.firstElementChild?.getAttribute("class")).toContain("text-success");
  });

  it("stays neutral when no direction is better", () => {
    const { container } = render(<Delta value={30} goodDirection="none" />);
    expect(container.firstElementChild?.getAttribute("class")).toContain("text-fg-secondary");
  });

  it("reads a flat metric as no change", () => {
    const { container } = render(<Delta value={0} />);
    expect(screen.getByText("no change")).toBeInTheDocument();
    expect(container.querySelector("rect")).toBeInTheDocument();
  });

  it("accepts a custom format for non-percentage deltas", () => {
    render(<Delta value={-42} format={(v) => `${v}ms`} />);
    expect(screen.getByText("−42ms")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Delta value={12.4} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
