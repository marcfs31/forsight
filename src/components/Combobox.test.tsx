import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { Combobox } from "./Combobox";

// Open-state accessibility is verified in real Chromium by the Storybook
// test runner (`Forsight/Forms/Combobox` stories) — same rationale as
// Dialog.test.tsx / Popover's portalled content.

const FRAMEWORKS = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro", disabled: true },
];

// .focus() + keyboard("{Enter}"), never .click() — jsdom lacks pointer
// capture (see the `testing` skill).
async function openCombobox() {
  screen.getByRole("button").focus();
  await userEvent.keyboard("{Enter}");
}

describe("Combobox", () => {
  it("shows the placeholder text when nothing is selected", () => {
    render(
      <Combobox options={FRAMEWORKS} placeholder="Select framework..." aria-label="Framework" />
    );
    // aria-label is the trigger's accessible name (it replaces visible text
    // for assistive tech); the placeholder is only the sighted-visible copy.
    expect(screen.getByRole("button", { name: "Framework" })).toHaveTextContent(
      "Select framework..."
    );
  });

  it("shows the selected option's label instead of the placeholder", () => {
    render(
      <Combobox
        options={FRAMEWORKS}
        value="remix"
        placeholder="Select framework..."
        aria-label="Framework"
      />
    );
    expect(screen.getByRole("button", { name: "Framework" })).toHaveTextContent("Remix");
  });

  it("opens on click and lists the options", async () => {
    render(<Combobox options={FRAMEWORKS} aria-label="Framework" />);
    await openCombobox();
    expect(screen.getByRole("option", { name: "Next.js" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Remix" })).toBeInTheDocument();
  });

  it("calls onValueChange and closes when an option is picked", async () => {
    const onValueChange = vi.fn();
    render(<Combobox options={FRAMEWORKS} onValueChange={onValueChange} aria-label="Framework" />);
    await openCombobox();
    await userEvent.click(screen.getByRole("option", { name: "Next.js" }));
    expect(onValueChange).toHaveBeenCalledWith("next");
    expect(screen.queryByRole("option", { name: "Next.js" })).not.toBeInTheDocument();
  });

  it("filters options as the search input is typed into", async () => {
    render(<Combobox options={FRAMEWORKS} aria-label="Framework" />);
    await openCombobox();
    await userEvent.type(screen.getByRole("combobox"), "rem");
    expect(screen.getByRole("option", { name: "Remix" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Next.js" })).not.toBeInTheDocument();
  });

  it("shows the empty message when the filter matches nothing", async () => {
    render(
      <Combobox options={FRAMEWORKS} emptyMessage="No framework found." aria-label="Framework" />
    );
    await openCombobox();
    await userEvent.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByText("No framework found.")).toBeInTheDocument();
  });

  it("does not allow selecting a disabled option", async () => {
    const onValueChange = vi.fn();
    render(<Combobox options={FRAMEWORKS} onValueChange={onValueChange} aria-label="Framework" />);
    await openCombobox();
    await userEvent.click(screen.getByRole("option", { name: "Astro" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("disables the trigger when disabled is set", () => {
    render(<Combobox options={FRAMEWORKS} disabled aria-label="Framework" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("has no accessibility violations when closed", async () => {
    const { container } = render(<Combobox options={FRAMEWORKS} aria-label="Framework" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
