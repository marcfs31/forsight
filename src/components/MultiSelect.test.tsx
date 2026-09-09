import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { MultiSelect } from "./MultiSelect";

const OPTIONS = [
  { value: "checkout-api", label: "checkout-api" },
  { value: "search-api", label: "search-api" },
  { value: "payments-api", label: "payments-api", disabled: true },
];

// .focus() + keyboard("{Enter}"), never .click() — jsdom lacks pointer
// capture; opening a Radix Popover via click is dramatically slower. See
// the `testing` skill / Combobox.test.tsx.
async function openMultiSelect() {
  screen.getByRole("button").focus();
  await userEvent.keyboard("{Enter}");
}

describe("MultiSelect", () => {
  it("shows the placeholder when nothing is selected", () => {
    render(
      <MultiSelect
        options={OPTIONS}
        value={[]}
        onValueChange={vi.fn()}
        placeholder="Select services..."
        aria-label="Services"
      />
    );
    expect(screen.getByRole("button", { name: "Services" })).toHaveTextContent(
      "Select services..."
    );
  });

  it("shows a chip per selected option", () => {
    render(
      <MultiSelect
        options={OPTIONS}
        value={["checkout-api", "search-api"]}
        onValueChange={vi.fn()}
        aria-label="Services"
      />
    );
    const trigger = screen.getByRole("button", { name: "Services" });
    expect(trigger).toHaveTextContent("checkout-api");
    expect(trigger).toHaveTextContent("search-api");
  });

  it("adds a value and keeps the popover open when an option is picked", async () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        options={OPTIONS}
        value={["checkout-api"]}
        onValueChange={onValueChange}
        aria-label="Services"
      />
    );
    await openMultiSelect();
    await userEvent.click(screen.getByRole("option", { name: "search-api" }));
    expect(onValueChange).toHaveBeenCalledWith(["checkout-api", "search-api"]);
    // Still open — the option list is still present.
    expect(screen.getByRole("option", { name: /checkout-api/ })).toBeInTheDocument();
  });

  it("removes a value when an already-selected option is picked again", async () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        options={OPTIONS}
        value={["checkout-api", "search-api"]}
        onValueChange={onValueChange}
        aria-label="Services"
      />
    );
    await openMultiSelect();
    await userEvent.click(screen.getByRole("option", { name: /checkout-api/ }));
    expect(onValueChange).toHaveBeenCalledWith(["search-api"]);
  });

  it("does not allow toggling a disabled option", async () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        options={OPTIONS}
        value={[]}
        onValueChange={onValueChange}
        aria-label="Services"
      />
    );
    await openMultiSelect();
    await userEvent.click(screen.getByRole("option", { name: "payments-api" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("disables the trigger when disabled is set", () => {
    render(
      <MultiSelect
        options={OPTIONS}
        value={[]}
        onValueChange={vi.fn()}
        disabled
        aria-label="Services"
      />
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("has no accessibility violations when closed", async () => {
    const { container } = render(
      <MultiSelect
        options={OPTIONS}
        value={["checkout-api"]}
        onValueChange={vi.fn()}
        aria-label="Services"
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
