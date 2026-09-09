import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./AlertDialog";
import { Button } from "./Button";

// Open-state accessibility and focus behavior are verified in real Chromium
// by the Storybook test runner (`Forsight/Overlays/AlertDialog` stories) — same
// rationale as Dialog.test.tsx.

function ExampleAlertDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe("AlertDialog", () => {
  it("is closed until the trigger is activated", () => {
    render(<ExampleAlertDialog />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("opens on trigger click with role=alertdialog and shows its title", async () => {
    render(<ExampleAlertDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Delete this project?")).toBeInTheDocument();
  });

  it("closes when Cancel is activated", async () => {
    render(<ExampleAlertDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("closes when the Action button is activated", async () => {
    render(<ExampleAlertDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("applies responsive width and overflow classes to AlertDialogContent", async () => {
    render(<ExampleAlertDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveClass("w-[calc(100vw-2rem)]");
    expect(dialog).toHaveClass("max-h-[calc(100vh-2rem)]");
    expect(dialog).toHaveClass("overflow-y-auto");
  });

  it("AlertDialogAction defaults to the danger button variant", async () => {
    render(<ExampleAlertDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("bg-danger");
  });

  it("AlertDialogAction accepts a variant override for non-destructive confirmations", async () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Publish?</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="primary">Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByRole("button", { name: "Publish" })).toHaveClass("bg-accent");
  });

  it("AlertDialogCancel defaults to the secondary button variant", async () => {
    render(<ExampleAlertDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("bg-ink-surface-2");
  });
});
