import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "../test-utils/axe";
import { Histogram } from "./Histogram";

const buckets = [
  { label: "0–50ms", count: 420 },
  { label: "50–100ms", count: 980 },
  { label: "100–150ms", count: 90 },
];

describe("Histogram", () => {
  it("draws one bar per bucket", () => {
    const { container } = render(<Histogram label="Duration" buckets={buckets} />);
    const bars = [...container.querySelectorAll("path")].filter((p) => p.getAttribute("d"));
    expect(bars).toHaveLength(3);
  });

  it("renders the bucket counts in the data table", () => {
    render(<Histogram label="Duration" buckets={buckets} />);
    expect(screen.getByRole("cell", { name: "420" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "980" })).toBeInTheDocument();
  });

  it("reads the focused bucket via arrow keys", async () => {
    const user = userEvent.setup();
    const { container } = render(<Histogram label="Duration" buckets={buckets} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    plot.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent("0–50ms: 420");
  });

  it("tracks a pointer to the bucket under it", () => {
    const { container } = render(<Histogram label="Duration" buckets={buckets} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    plot.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 600,
        height: 220,
        right: 600,
        bottom: 220,
        x: 0,
        y: 0,
      }) as DOMRect;

    fireEvent(plot, new MouseEvent("pointermove", { clientX: 500, bubbles: true }));
    expect(screen.getByRole("status")).toHaveTextContent("100–150ms");

    fireEvent.pointerLeave(plot);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("ignores a pointer event with no coordinates", () => {
    const { container } = render(<Histogram label="Duration" buckets={buckets} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    // The guard under test fires when a pointer event carries no usable
    // coordinate. It cannot be reached through fireEvent's init object any
    // more: jsdom 30 implements PointerEvent properly, and `clientX` is a
    // WebIDL `long`, so both an omitted value and NaN arrive as 0 — a
    // perfectly valid coordinate the component is right to honour. Defining
    // the property on a constructed event sidesteps that coercion and aims
    // the test back at the branch it names.
    const event = new PointerEvent("pointermove", { bubbles: true });
    Object.defineProperty(event, "clientX", { value: NaN });
    fireEvent(plot, event);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("renders with no buckets at all", () => {
    const { container } = render(<Histogram label="Nothing" buckets={[]} />);
    const plot = container.querySelector("[tabindex='0']") as HTMLElement;
    fireEvent(plot, new MouseEvent("pointermove", { clientX: 10, bubbles: true }));
    expect(screen.getByRole("img", { name: "Nothing" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Histogram label="Duration" description="Request latency" buckets={buckets} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
