import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { CodeBlock } from "./CodeBlock";

describe("CodeBlock", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });
  });

  it("renders the code as text content", () => {
    render(<CodeBlock code="npm install forsight" />);
    expect(screen.getByText("npm install forsight")).toBeInTheDocument();
  });

  it("renders an optional label", () => {
    render(<CodeBlock code="curl ..." label="curl" />);
    expect(screen.getByText("curl")).toBeInTheDocument();
  });

  it("shows a copy button by default that copies the code", async () => {
    render(<CodeBlock code="npm install forsight" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith("npm install forsight");
  });

  it("omits the copy button when showCopy is false", () => {
    render(<CodeBlock code="npm install forsight" showCopy={false} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("wraps long lines instead of scrolling when wrap is set", () => {
    render(<CodeBlock code="a very long line" wrap />);
    const pre = screen.getByText("a very long line").closest("pre");
    expect(pre).toHaveClass("whitespace-pre-wrap");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<CodeBlock code="npm install forsight" label="Terminal" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
