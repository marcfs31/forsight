import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { JSONViewer } from "./JSONViewer";

const DATA = {
  service: "checkout-api",
  http: { method: "POST", status_code: 500 },
  tags: ["payments", "critical"],
  retry: false,
  error: null,
};

describe("JSONViewer", () => {
  it("shows the root's own keys by default, with nested objects collapsed", () => {
    render(<JSONViewer label="Attributes" data={DATA} />);
    expect(screen.getByText(/"checkout-api"/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /http/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/status_code/)).not.toBeInTheDocument();
  });

  it("expands a collapsed node on click, revealing its children", async () => {
    render(<JSONViewer label="Attributes" data={DATA} />);
    const httpToggle = screen.getByRole("button", { name: /http/ });
    await userEvent.click(httpToggle);
    expect(httpToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/status_code/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
  });

  it("collapses an expanded node back on a second click, removing its children from the DOM", async () => {
    render(<JSONViewer label="Attributes" data={DATA} />);
    const httpToggle = screen.getByRole("button", { name: /http/ });
    await userEvent.click(httpToggle);
    await userEvent.click(httpToggle);
    expect(httpToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/status_code/)).not.toBeInTheDocument();
  });

  it("renders arrays with an item count when collapsed", () => {
    render(<JSONViewer label="Attributes" data={DATA} />);
    expect(screen.getByRole("button", { name: /tags/ })).toHaveTextContent("2 items");
  });

  it("prints null and boolean primitives distinctly from strings", () => {
    render(<JSONViewer label="Attributes" data={DATA} />);
    expect(screen.getByText("null")).toBeInTheDocument();
    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("expands nested levels up front when defaultDepth is set", () => {
    render(<JSONViewer label="Attributes" data={DATA} defaultDepth={5} />);
    expect(screen.getByText(/status_code/)).toBeInTheDocument();
  });

  it("renders an empty object without a toggle", () => {
    render(<JSONViewer label="Attributes" data={{}} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a primitive root directly", () => {
    render(<JSONViewer label="Count" data={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<JSONViewer label="Attributes" data={DATA} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when expanded", async () => {
    const { container } = render(<JSONViewer label="Attributes" data={DATA} defaultDepth={5} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
