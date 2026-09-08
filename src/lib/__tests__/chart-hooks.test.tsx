import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useMeasuredWidth } from "../chart-hooks";

/** Captures the observed node and lets a test push a contentRect at it. */
function installResizeObserver() {
  const instances: Array<{
    callback: ResizeObserverCallback;
    observed: Element[];
    disconnected: boolean;
  }> = [];
  const original = window.ResizeObserver;

  class SpyResizeObserver {
    private record;
    constructor(callback: ResizeObserverCallback) {
      this.record = { callback, observed: [] as Element[], disconnected: false };
      instances.push(this.record);
    }
    observe(node: Element) {
      this.record.observed.push(node);
    }
    unobserve() {}
    disconnect() {
      this.record.disconnected = true;
    }
  }

  window.ResizeObserver = SpyResizeObserver as unknown as typeof ResizeObserver;
  return {
    instances,
    restore: () => {
      window.ResizeObserver = original;
    },
  };
}

function Probe({ fallback = 120 }: { fallback?: number }) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>(fallback);
  return (
    <div ref={ref} data-testid="probe">
      {width}
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMeasuredWidth", () => {
  it("reports the fallback until the element has been measured", () => {
    render(<Probe fallback={321} />);
    expect(screen.getByTestId("probe")).toHaveTextContent("321");
  });

  it("adopts the observed width", () => {
    const observer = installResizeObserver();
    try {
      render(<Probe />);
      const entry = { contentRect: { width: 480 } } as ResizeObserverEntry;
      act(() => observer.instances[0].callback([entry], {} as ResizeObserver));
      expect(screen.getByTestId("probe")).toHaveTextContent("480");
    } finally {
      observer.restore();
    }
  });

  it("keeps the last known width when the element measures zero (hidden)", () => {
    const observer = installResizeObserver();
    try {
      render(<Probe fallback={200} />);
      act(() =>
        observer.instances[0].callback(
          [{ contentRect: { width: 0 } } as ResizeObserverEntry],
          {} as ResizeObserver
        )
      );
      expect(screen.getByTestId("probe")).toHaveTextContent("200");
    } finally {
      observer.restore();
    }
  });

  it("tolerates an observer callback with no entries", () => {
    const observer = installResizeObserver();
    try {
      render(<Probe fallback={150} />);
      act(() => observer.instances[0].callback([], {} as ResizeObserver));
      expect(screen.getByTestId("probe")).toHaveTextContent("150");
    } finally {
      observer.restore();
    }
  });

  it("disconnects when the element goes away", () => {
    const observer = installResizeObserver();
    try {
      const { unmount } = render(<Probe />);
      unmount();
      expect(observer.instances[0].disconnected).toBe(true);
    } finally {
      observer.restore();
    }
  });
});
