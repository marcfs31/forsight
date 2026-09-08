import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { UptimeBar } from "./UptimeBar";
import type { UptimeSegment } from "./UptimeBar";

const segments: UptimeSegment[] = [
  { label: "1 Mar", status: "operational" },
  { label: "2 Mar", status: "degraded", detail: "elevated p99" },
  { label: "3 Mar", status: "outage", detail: "database failover" },
  { label: "4 Mar", status: "operational" },
];

describe("UptimeBar", () => {
  it("summarizes uptime over the window", () => {
    render(<UptimeBar label="checkout-api" segments={segments} />);
    expect(screen.getByText("50% uptime")).toBeInTheDocument();
  });

  it("ignores periods with no data when computing uptime", () => {
    render(
      <UptimeBar
        label="checkout-api"
        segments={[...segments, { label: "5 Mar", status: "unknown" }]}
      />
    );
    expect(screen.getByText("50% uptime")).toBeInTheDocument();
  });

  it("lists only the unhealthy periods for non-visual readers", () => {
    render(<UptimeBar label="checkout-api" segments={segments} />);
    const incidents = screen.getAllByRole("listitem");
    expect(incidents).toHaveLength(2);
    expect(incidents[0]).toHaveTextContent("2 Mar: Degraded, elevated p99");
    expect(incidents[1]).toHaveTextContent("3 Mar: Outage, database failover");
  });

  it("says so when nothing went wrong", () => {
    render(<UptimeBar label="checkout-api" segments={[segments[0], segments[3]]} />);
    expect(screen.getByText("No degraded or failing periods.")).toBeInTheDocument();
    expect(screen.getByText("100% uptime")).toBeInTheDocument();
  });

  it("handles an empty window without dividing by zero", () => {
    render(<UptimeBar label="new-service" segments={[]} />);
    expect(screen.getByText("0% uptime")).toBeInTheDocument();
  });

  it("renders the window's end captions when given", () => {
    render(
      <UptimeBar
        label="checkout-api"
        segments={segments}
        startCaption="90 days ago"
        endCaption="Today"
      />
    );
    expect(screen.getByText("90 days ago")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<UptimeBar label="checkout-api" segments={segments} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
