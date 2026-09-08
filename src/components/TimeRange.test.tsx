import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { axe } from "../test-utils/axe";
import { TimeRange } from "./TimeRange";

const options = [
  { value: "1h", label: "1h", description: "Last 1 hour" },
  { value: "6h", label: "6h", description: "Last 6 hours" },
  { value: "24h", label: "24h", description: "Last 24 hours" },
];

function Controlled({ onChange }: { onChange?: (value: string) => void } = {}) {
  const [value, setValue] = React.useState("6h");
  return (
    <TimeRange
      label="Dashboard time range"
      options={options}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe("TimeRange", () => {
  it("is a radio group with exactly one option selected", () => {
    render(<Controlled />);
    expect(screen.getByRole("radiogroup", { name: "Dashboard time range" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Last 6 hours" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Last 1 hour" })).not.toBeChecked();
  });

  it("keeps only the selected option in the tab order", () => {
    render(<Controlled />);
    expect(screen.getByRole("radio", { name: "Last 6 hours" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Last 1 hour" })).toHaveAttribute("tabindex", "-1");
  });

  it("selects on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await user.click(screen.getByRole("radio", { name: "Last 24 hours" }));
    expect(onChange).toHaveBeenCalledWith("24h");
    expect(screen.getByRole("radio", { name: "Last 24 hours" })).toBeChecked();
  });

  it("moves and selects with the arrow keys, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    screen.getByRole("radio", { name: "Last 6 hours" }).focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Last 24 hours" })).toBeChecked();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Last 1 hour" })).toBeChecked();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Last 24 hours" })).toBeChecked();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Last 1 hour" })).toBeChecked();

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("radio", { name: "Last 24 hours" })).toBeChecked();
  });

  it("jumps to the ends with Home and End", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    screen.getByRole("radio", { name: "Last 6 hours" }).focus();

    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Last 24 hours" })).toBeChecked();

    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "Last 1 hour" })).toBeChecked();
  });

  it("ignores keys it doesn't own", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    screen.getByRole("radio", { name: "Last 6 hours" }).focus();
    await user.keyboard("x");
    expect(screen.getByRole("radio", { name: "Last 6 hours" })).toBeChecked();
  });

  it("gives the first option the tab stop when nothing matches the value", () => {
    render(
      <TimeRange label="Range" options={options} value="never-set" onValueChange={() => {}} />
    );
    expect(screen.getByRole("radio", { name: "Last 1 hour" })).toHaveAttribute("tabindex", "0");
  });

  it("falls back to the visible label when no description is given", () => {
    render(
      <TimeRange
        label="Range"
        options={[{ value: "7d", label: "7d" }]}
        value="7d"
        onValueChange={() => {}}
      />
    );
    expect(screen.getByRole("radio", { name: "7d" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Controlled />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
