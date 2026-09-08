import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { StatusDot } from "./StatusDot";

describe("StatusDot", () => {
  it("prints the status word beside the dot by default", () => {
    render(<StatusDot status="degraded" />);
    expect(screen.getByText("Degraded")).toBeInTheDocument();
  });

  it("takes custom wording", () => {
    render(<StatusDot status="operational" label="All systems go" />);
    expect(screen.getByText("All systems go")).toBeInTheDocument();
  });

  it("keeps the status announced even when the word is hidden", () => {
    const { container } = render(<StatusDot status="outage" label={null} />);
    expect(container).toHaveTextContent("Outage");
    expect(container.querySelector(".sr-only")).toHaveTextContent("Outage");
  });

  it("tones the dot per status", () => {
    const { container } = render(<StatusDot status="outage" />);
    expect(container.querySelector("span[aria-hidden='true']")?.getAttribute("class")).toContain(
      "bg-danger"
    );
  });

  it("adds a pulse layer only when asked, and drops it under reduced motion", () => {
    const { container: still } = render(<StatusDot status="operational" />);
    expect(still.querySelectorAll("span[aria-hidden='true']")).toHaveLength(1);

    const { container: live } = render(<StatusDot status="operational" pulse />);
    const layers = live.querySelectorAll("span[aria-hidden='true']");
    expect(layers).toHaveLength(2);
    expect(layers[0].getAttribute("class")).toContain("motion-reduce:hidden");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<StatusDot status="maintenance" pulse />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
