import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { ErrorBudget } from "./ErrorBudget";

describe("ErrorBudget", () => {
  it("exposes the consumed value as an ARIA meter", () => {
    render(<ErrorBudget label="30-day error budget" consumed={40} />);
    const meter = screen.getByRole("meter", { name: "30-day error budget" });
    expect(meter).toHaveAttribute("aria-valuenow", "40");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
  });

  it("prints the remaining percentage as the headline number", () => {
    render(<ErrorBudget label="30-day error budget" consumed={40} />);
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("is healthy below the warning threshold", () => {
    render(<ErrorBudget label="Budget" consumed={40} />);
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("is at-risk between the warning and danger thresholds", () => {
    render(<ErrorBudget label="Budget" consumed={75} />);
    expect(screen.getByText("At risk")).toBeInTheDocument();
  });

  it("is critical at or above the danger threshold", () => {
    render(<ErrorBudget label="Budget" consumed={95} />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("honors custom thresholds", () => {
    render(<ErrorBudget label="Budget" consumed={55} warningAt={50} dangerAt={80} />);
    expect(screen.getByText("At risk")).toBeInTheDocument();
  });

  it("clamps out-of-range values", () => {
    render(<ErrorBudget label="Budget" consumed={140} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders an optional caption", () => {
    render(<ErrorBudget label="Budget" consumed={40} caption="Resets in 8 days" />);
    expect(screen.getByText("Resets in 8 days")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ErrorBudget label="30-day error budget" consumed={78} caption="Resets in 3 days" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
