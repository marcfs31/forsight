import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="No deployments yet" />);
    expect(screen.getByText("No deployments yet")).toBeInTheDocument();
  });

  it("renders an optional description", () => {
    render(<EmptyState title="No deployments yet" description="Push to see them here." />);
    expect(screen.getByText("Push to see them here.")).toBeInTheDocument();
  });

  it("omits the description when not provided", () => {
    const { container } = render(<EmptyState title="No deployments yet" />);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("renders an optional action", () => {
    render(<EmptyState title="No results" action={<Button>Clear filters</Button>} />);
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });

  it("hides the icon from assistive tech", () => {
    render(<EmptyState title="No results" icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("defaults to role=status, overridable via the role prop", () => {
    const { rerender } = render(<EmptyState title="No results" />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    rerender(<EmptyState title="No results" role="region" aria-label="Results" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Results" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <EmptyState
        icon={<svg />}
        title="No deployments yet"
        description="Push to see them here."
        action={<Button>Deploy now</Button>}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
