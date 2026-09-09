import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./Dialog";
import { Button } from "./Button";

// Open-state accessibility is verified in real Chromium by the Storybook
// test runner (`Forsight/Overlays/Dialog` stories). `axe` on an open portalled dialog
// under jsdom (no layout engine) is minutes-slow and unreliable.

function ExampleDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Delete project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this project?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("is closed until the trigger is activated", () => {
    render(<ExampleDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on trigger click and shows its title", async () => {
    render(<ExampleDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete this project?")).toBeInTheDocument();
  });

  it("applies responsive width and overflow classes to DialogContent", async () => {
    render(<ExampleDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("w-[calc(100vw-2rem)]");
    expect(dialog).toHaveClass("max-h-[calc(100vh-2rem)]");
    expect(dialog).toHaveClass("overflow-y-auto");
  });

  it("close button has adequate touch target size", async () => {
    render(<ExampleDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toHaveClass("min-h-10");
    expect(closeButton).toHaveClass("min-w-10");
  });

  it("omits the close button when hideClose is set, relying on Escape instead", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent hideClose>
          <DialogTitle>Chrome-free surface</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});
