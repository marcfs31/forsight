import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { Stepper } from "./Stepper";

const STEPS = [{ label: "Account" }, { label: "Team" }, { label: "Billing" }, { label: "Review" }];

describe("Stepper", () => {
  it("renders a real ordered list with one item per step", () => {
    render(<Stepper label="Setup" steps={STEPS} currentStep={0} />);
    expect(screen.getByRole("list", { name: "Setup" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("marks the current step with aria-current=step", () => {
    render(<Stepper label="Setup" steps={STEPS} currentStep={1} />);
    const items = screen.getAllByRole("listitem");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[2]).not.toHaveAttribute("aria-current");
  });

  it("shows a checkmark instead of a number for completed steps", () => {
    const { container } = render(<Stepper label="Setup" steps={STEPS} currentStep={2} />);
    // Steps 0 and 1 are complete (before currentStep=2): 2 checkmarks.
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("renders every step's number when nothing is complete yet", () => {
    render(<Stepper label="Setup" steps={STEPS} currentStep={0} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders an optional description per step", () => {
    render(
      <Stepper
        label="Setup"
        steps={[{ label: "Account", description: "Create your login" }]}
        currentStep={0}
      />
    );
    expect(screen.getByText("Create your login")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Stepper label="Setup" steps={STEPS} currentStep={1} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
