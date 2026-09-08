import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { Sparkline } from "./Sparkline";

const values = [4, 9, 6, 12, 8];

describe("Sparkline", () => {
  it("summarizes the trend in its accessible name", () => {
    render(<Sparkline label="Error rate" values={values} />);
    expect(
      screen.getByRole("img", {
        name: "Error rate: 5 samples, low 4, high 12, latest 8",
      })
    ).toBeInTheDocument();
  });

  it("says so when there is no data", () => {
    render(<Sparkline label="Error rate" values={[]} />);
    expect(screen.getByRole("img", { name: "Error rate: no data" })).toBeInTheDocument();
  });

  it("draws a fill and a line by default", () => {
    const { container } = render(<Sparkline label="Rate" values={values} />);
    expect(container.querySelectorAll("path")).toHaveLength(2);
  });

  it("draws one mark per sample as bars", () => {
    const { container } = render(<Sparkline label="Rate" values={values} variant="bar" />);
    expect(container.querySelectorAll("path")).toHaveLength(values.length);
  });

  it("carries the tone through to the mark", () => {
    const { container } = render(<Sparkline label="Rate" values={values} tone="danger" />);
    expect(container.querySelector("path")?.getAttribute("class")).toContain("fill-danger");
  });

  it("centers a single sample instead of dividing by zero", () => {
    const { container } = render(<Sparkline label="Rate" values={[7]} />);
    expect(container.querySelector("path")?.getAttribute("d")).not.toContain("NaN");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Sparkline label="Error rate" values={values} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
