import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "../test-utils/axe";
import { ScrollArea } from "./ScrollArea";

// The custom scrollbar/thumb only mount once Radix measures real overflow
// (content taller than the viewport), which needs a real layout engine —
// jsdom always reports zero size, so that visible-scrollbar state is
// exercised in the Storybook test runner instead (see CONTRIBUTING.md's
// jsdom boundary note). This file covers what's deterministic here: content
// passes through into the native-scrolling viewport, and the static
// (no-scrollbar-yet) structure has no accessibility violations.

describe("ScrollArea", () => {
  it("renders its children inside the scrollable viewport", () => {
    render(
      <ScrollArea>
        <p>Release notes</p>
      </ScrollArea>
    );
    expect(screen.getByText("Release notes")).toBeInTheDocument();
  });

  it("forwards className and other props to the root", () => {
    const { container } = render(
      <ScrollArea className="h-40 w-64" data-testid="notes-scroll">
        content
      </ScrollArea>
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("h-40", "w-64");
    expect(root).toHaveAttribute("data-testid", "notes-scroll");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ScrollArea className="h-40 w-64">
        <p>Plenty of content that would overflow in a real browser.</p>
      </ScrollArea>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
