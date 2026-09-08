import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders the headline reading with its unit", () => {
    render(<StatCard label="p95 latency" value="248" unit="ms" />);
    expect(screen.getByText("p95 latency")).toBeInTheDocument();
    expect(screen.getByText("248")).toBeInTheDocument();
    expect(screen.getByText("ms")).toBeInTheDocument();
  });

  it("shows the delta against its stated baseline", () => {
    render(
      <StatCard
        label="p95 latency"
        value="248"
        delta={-12}
        deltaGoodDirection="down"
        deltaCaption="vs. previous 24h"
      />
    );
    expect(screen.getByText("−12%")).toBeInTheDocument();
    expect(screen.getByText("vs. previous 24h")).toBeInTheDocument();
    expect(screen.getByText("decrease")).toBeInTheDocument();
  });

  it("omits the delta row entirely when there is nothing to compare", () => {
    render(<StatCard label="Requests" value="1.2M" />);
    expect(screen.queryByText("increase")).not.toBeInTheDocument();
    expect(screen.queryByText("no change")).not.toBeInTheDocument();
  });

  it("draws a trend when samples are given", () => {
    render(<StatCard label="Requests" value="1.2M" trend={[1, 4, 2, 6]} trendTone="success" />);
    expect(screen.getByRole("img", { name: /Requests trend/ })).toBeInTheDocument();
  });

  it("skips the trend for an empty sample set", () => {
    render(<StatCard label="Requests" value="1.2M" trend={[]} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows service health next to the label", () => {
    render(<StatCard label="Requests" value="1.2M" status="degraded" />);
    expect(screen.getByText("Degraded")).toBeInTheDocument();
  });

  it("takes custom status wording", () => {
    render(<StatCard label="Requests" value="1.2M" status="operational" statusLabel="Healthy" />);
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <StatCard
        label="p95 latency"
        value="248"
        unit="ms"
        delta={-12}
        deltaGoodDirection="down"
        deltaCaption="vs. previous 24h"
        trend={[3, 5, 4, 8]}
        status="operational"
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
