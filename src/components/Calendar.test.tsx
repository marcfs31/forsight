import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { Calendar, DatePicker, DateRangePicker } from "./Calendar";

// Calendar itself isn't a floating-ui popper (it's plain in-flow markup), so
// it renders fast under jsdom and gets full axe coverage here. DatePicker
// wraps Popover, one of the floating-ui overlays this repo moved entirely to
// the Storybook test runner (see CONTRIBUTING.md's jsdom boundary note) — so
// only its closed-state trigger is exercised in jsdom; open-state grid
// navigation and selection are covered by Calendar.stories.tsx `play` tests.

describe("Calendar", () => {
  it("renders a labelled date grid whose day buttons carry a full accessible name", () => {
    render(
      <Calendar mode="single" selected={new Date(2026, 8, 8)} defaultMonth={new Date(2026, 8, 1)} />
    );
    expect(screen.getByRole("grid", { name: /September 2026/i })).toBeInTheDocument();
    // Each day button's own accessible name is the full formatted date (e.g.
    // "Tuesday, September 8th, 2026, selected"), not just the visible digit —
    // react-day-picker's own `labelDayButton`, not something this wrapper adds.
    expect(screen.getByRole("button", { name: /September 8.*selected/i })).toBeInTheDocument();
  });

  it("gives the month navigation buttons real accessible names", () => {
    render(<Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} />);
    expect(screen.getByRole("button", { name: "Go to the Previous Month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to the Next Month" })).toBeInTheDocument();
  });

  it("calls onSelect when a day is clicked", async () => {
    const onSelect = vi.fn();
    render(<Calendar mode="single" onSelect={onSelect} defaultMonth={new Date(2026, 8, 1)} />);
    // September 8, 2026 is a Tuesday.
    await userEvent.click(screen.getByRole("button", { name: /Tuesday, September 8/i }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date),
      expect.anything(),
      expect.anything()
    );
  });

  it("marks a disabled date unselectable and never fires onSelect for it", async () => {
    const onSelect = vi.fn();
    render(
      <Calendar
        mode="single"
        onSelect={onSelect}
        defaultMonth={new Date(2026, 8, 1)}
        disabled={{ dayOfWeek: [0, 6] }}
      />
    );
    // September 12, 2026 is a Saturday.
    const saturday = screen.getByRole("button", { name: /Saturday, September 12/i });
    expect(saturday).toBeDisabled();
    await userEvent.click(saturday);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Calendar mode="single" selected={new Date(2026, 8, 8)} defaultMonth={new Date(2026, 8, 1)} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("marks every day between a range's two ends as selected, not just the endpoints", () => {
    render(
      <Calendar
        mode="range"
        selected={{ from: new Date(2026, 8, 8), to: new Date(2026, 8, 11) }}
        defaultMonth={new Date(2026, 8, 1)}
      />
    );
    // react-day-picker's own accessible-name wording flags every day inside
    // the range as "selected", including the two endpoints — this is what
    // `range_middle`'s distinct fill in `CalendarDayButton` is styling.
    for (const day of [8, 9, 10, 11]) {
      expect(
        screen.getByRole("button", { name: new RegExp(`September ${day}.*selected`, "i") })
      ).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /September 12(?!.*selected)/i })).toBeInTheDocument();
  });

  it("has no accessibility violations in range mode", async () => {
    const { container } = render(
      <Calendar
        mode="range"
        selected={{ from: new Date(2026, 8, 8), to: new Date(2026, 8, 11) }}
        defaultMonth={new Date(2026, 8, 1)}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DatePicker", () => {
  it("uses the placeholder as the trigger's accessible name when nothing is selected", () => {
    render(<DatePicker placeholder="Pick a deploy date" />);
    expect(screen.getByRole("button", { name: "Pick a deploy date" })).toBeInTheDocument();
  });

  it("reflects the selected date in the trigger's accessible name, not a generic label", () => {
    // The date portion is formatted via `Intl.DateTimeFormat(undefined, ...)`
    // — the runtime's own locale — so match only the stable, hardcoded
    // "Selected date: ... Change date." wording plus the day digit, not a
    // full locale-specific sentence.
    render(<DatePicker value={new Date(2026, 8, 8)} />);
    expect(
      screen.getByRole("button", { name: /^Selected date:.*8.*\. Change date\.$/ })
    ).toBeInTheDocument();
  });

  it("is closed until the trigger is activated", () => {
    render(<DatePicker />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});

describe("DateRangePicker", () => {
  it("uses the placeholder as the trigger's accessible name when nothing is selected", () => {
    render(<DateRangePicker placeholder="Pick a deploy window" />);
    expect(screen.getByRole("button", { name: "Pick a deploy window" })).toBeInTheDocument();
  });

  it("shows a partial range with a trailing ellipsis while only the start is picked", () => {
    render(<DateRangePicker value={{ from: new Date(2026, 8, 8), to: undefined }} />);
    expect(
      screen.getByRole("button", { name: /^Selected range:.*–\s*…\. Change range\.$/ })
    ).toBeInTheDocument();
  });

  it("reflects a complete range in the trigger's accessible name", () => {
    render(<DateRangePicker value={{ from: new Date(2026, 8, 8), to: new Date(2026, 8, 11) }} />);
    expect(
      screen.getByRole("button", { name: /^Selected range:.*–.*\. Change range\.$/ })
    ).toBeInTheDocument();
  });

  it("is closed until the trigger is activated", () => {
    render(<DateRangePicker />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });
});
