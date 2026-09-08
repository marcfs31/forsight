import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { Timeline } from "./Timeline";

const items = [
  { id: "1", time: "14:02", title: "Alert fired", tone: "danger" as const },
  { id: "2", time: "14:09", title: "Acknowledged", description: "by @marc" },
  { id: "3", time: "14:31", title: "Resolved", tone: "success" as const },
];

describe("Timeline", () => {
  it("renders the events as an ordered list", () => {
    render(<Timeline items={items} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Alert fired")).toBeInTheDocument();
    expect(screen.getByText("by @marc")).toBeInTheDocument();
  });

  it("tones the marker by severity", () => {
    const { container } = render(<Timeline items={items} />);
    const markers = container.querySelectorAll("li span.rounded-full");
    expect(markers[0].getAttribute("class")).toContain("bg-danger");
    expect(markers[1].getAttribute("class")).toContain("bg-ink-surface-2");
  });

  it("draws a connector between events but not after the last one", () => {
    const { container } = render(<Timeline items={items} />);
    expect(container.querySelectorAll("span.w-px")).toHaveLength(2);
  });

  it("renders a single event without a connector", () => {
    const { container } = render(<Timeline items={[items[0]]} />);
    expect(container.querySelectorAll("span.w-px")).toHaveLength(0);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Timeline items={items} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
