import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { Kbd } from "./Kbd";

describe("Kbd", () => {
  it("renders as a native <kbd> element with its content", () => {
    render(<Kbd>Esc</Kbd>);
    const kbd = screen.getByText("Esc");
    expect(kbd.tagName).toBe("KBD");
  });

  it("merges a custom className", () => {
    render(<Kbd className="ms-2">K</Kbd>);
    expect(screen.getByText("K")).toHaveClass("ms-2");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <span>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
