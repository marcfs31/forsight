import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { LogStream, LOG_LEVELS } from "./LogStream";

const entries = [
  {
    id: "1",
    timestamp: "14:02:11",
    level: "info" as const,
    message: "deploy started",
    source: "ci",
  },
  { id: "2", timestamp: "14:02:44", level: "error" as const, message: "connection refused" },
];

describe("LogStream", () => {
  it("is an ARIA log region named after the stream", () => {
    render(<LogStream label="checkout-api logs" entries={entries} />);
    expect(screen.getByRole("log", { name: "checkout-api logs" })).toBeInTheDocument();
  });

  it("prints the level as a word next to each line", () => {
    render(<LogStream label="logs" entries={entries} />);
    expect(screen.getByText("info")).toBeInTheDocument();
    expect(screen.getByText("error")).toBeInTheDocument();
    expect(screen.getByText("connection refused")).toBeInTheDocument();
    expect(screen.getByText("ci")).toBeInTheDocument();
  });

  it("stays silent unless announcing is explicitly asked for", () => {
    const { rerender } = render(<LogStream label="logs" entries={entries} />);
    expect(screen.getByRole("log")).toHaveAttribute("aria-live", "off");
    rerender(<LogStream label="logs" entries={entries} announce />);
    expect(screen.getByRole("log")).toHaveAttribute("aria-live", "polite");
  });

  it("says when the window is empty", () => {
    render(<LogStream label="logs" entries={[]} />);
    expect(screen.getByText("No log lines in this window.")).toBeInTheDocument();
  });

  it("scrolls inside its own box, and that box is reachable by keyboard", () => {
    render(<LogStream label="logs" entries={entries} maxHeight={200} />);
    const region = screen.getByRole("log");
    expect(region).toHaveStyle({ maxHeight: "200px" });
    expect(region.getAttribute("class")).toContain("overflow-y-auto");
    expect(region).toHaveAttribute("tabindex", "0");
  });

  it("exports the levels in severity order for filter controls", () => {
    expect(LOG_LEVELS).toEqual(["debug", "info", "warn", "error", "fatal"]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<LogStream label="checkout-api logs" entries={entries} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
