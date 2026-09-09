import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./Drawer";
import { Button } from "./Button";

// Open-state accessibility and the slide animation are verified in real
// Chromium by the Storybook test runner (`Forsight/Overlays/Drawer` stories) —
// same rationale as Dialog.test.tsx.

function ExampleDrawer(props: { side?: "start" | "end"; hideClose?: boolean }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>View deployment</Button>
      </DrawerTrigger>
      <DrawerContent side={props.side} hideClose={props.hideClose}>
        <DrawerHeader>
          <DrawerTitle>Deployment #4821</DrawerTitle>
          <DrawerDescription>main @ 8f3c1ab</DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}

describe("Drawer", () => {
  it("is closed until the trigger is activated", () => {
    render(<ExampleDrawer />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on trigger click and shows its title", async () => {
    render(<ExampleDrawer />);
    await userEvent.click(screen.getByRole("button", { name: "View deployment" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Deployment #4821")).toBeInTheDocument();
  });

  it("defaults to the end side with a responsive width cap", async () => {
    render(<ExampleDrawer />);
    await userEvent.click(screen.getByRole("button", { name: "View deployment" }));
    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveClass("end-0");
    expect(drawer).toHaveClass("w-[calc(100vw-2rem)]");
    expect(drawer).toHaveClass("max-w-md");
  });

  it("anchors to the start side when side='start'", async () => {
    render(<ExampleDrawer side="start" />);
    await userEvent.click(screen.getByRole("button", { name: "View deployment" }));
    expect(screen.getByRole("dialog")).toHaveClass("start-0");
  });

  it("close button has adequate touch target size", async () => {
    render(<ExampleDrawer />);
    await userEvent.click(screen.getByRole("button", { name: "View deployment" }));
    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton).toHaveClass("min-h-10");
    expect(closeButton).toHaveClass("min-w-10");
  });

  it("omits the close button when hideClose is set", async () => {
    render(<ExampleDrawer hideClose />);
    await userEvent.click(screen.getByRole("button", { name: "View deployment" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});
