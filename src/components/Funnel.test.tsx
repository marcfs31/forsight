import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { Funnel } from "./Funnel";

const stages = [
  { label: "Visited pricing page", value: 1000 },
  { label: "Started signup", value: 400 },
  { label: "Became a paying customer", value: 100 },
];

describe("Funnel", () => {
  it("prints every stage's value as text", () => {
    render(<Funnel stages={stages} />);
    expect(screen.getByText("1k")).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("scales every stage's bar against the first stage, not the previous one", () => {
    const { container } = render(<Funnel stages={stages} />);
    const bars = container.querySelectorAll("span[aria-hidden='true']");
    expect((bars[0] as HTMLElement).style.width).toBe("100%");
    expect((bars[1] as HTMLElement).style.width).toBe("40%");
    expect((bars[2] as HTMLElement).style.width).toBe("10%");
  });

  it("prints the step conversion (this stage over the previous one) for every stage after the first", () => {
    render(<Funnel stages={stages} />);
    // Started signup: 400/1000 = 40%. Became a paying customer: 100/400 = 25%.
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("omits a step-conversion figure for the first stage", () => {
    render(<Funnel stages={stages} />);
    const firstRow = screen.getByText(stages[0].label).closest("li");
    expect(firstRow?.textContent).not.toMatch(/%/);
  });

  it("survives a zero-value first stage without dividing by zero", () => {
    const { container } = render(<Funnel stages={[{ label: "none", value: 0 }]} />);
    const bar = container.querySelector("span[aria-hidden='true']") as HTMLElement;
    expect(bar.style.width).toBe("0%");
  });

  it("survives a zero-value stage in the middle without dividing by zero for the next step", () => {
    render(
      <Funnel
        stages={[
          { label: "a", value: 100 },
          { label: "b", value: 0 },
          { label: "c", value: 50 },
        ]}
      />
    );
    const rowC = screen.getByText("c").closest("li");
    expect(rowC?.textContent).not.toMatch(/%/);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Funnel stages={stages} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
