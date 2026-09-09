import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    // navigator.clipboard is a getter-only accessor in jsdom — plain
    // assignment throws (or silently no-ops, depending on what an earlier
    // test left behind). defineProperty forcibly replaces it every time.
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });
  });

  it("renders with the idle label", () => {
    render(<CopyButton value="hello" />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("copies the value to the clipboard on click", async () => {
    render(<CopyButton value="hello world" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("hello world");
  });

  it("switches to the copied label after a successful copy", async () => {
    render(<CopyButton value="hello" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
  });

  it("reverts to the idle label after resetAfter elapses", async () => {
    render(<CopyButton value="hello" resetAfter={20} />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument());
  });

  it("supports custom labels", async () => {
    render(<CopyButton value="key" label="Copy API key" copiedLabel="Key copied!" />);
    expect(screen.getByRole("button", { name: "Copy API key" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Copy API key" }));
    expect(screen.getByRole("button", { name: "Key copied!" })).toBeInTheDocument();
  });

  it("stays idle when the clipboard write is rejected", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    render(<CopyButton value="hello" />);
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<CopyButton value="hello" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
