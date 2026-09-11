import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL's own auto-cleanup only registers when it detects test-framework
// globals (afterEach on `globalThis`) — this project runs with
// `test.globals: false` and explicit vitest imports, so it never fires
// without this (mirrors the root design-system package's vitest.setup.ts).
afterEach(() => {
  cleanup();
});

/**
 * jsdom doesn't implement these — the design-system's Radix-based overlay
 * primitives (FilterBar's popover, among others rendered by App) call them
 * during pointer interaction and layout, so a render crashes without a
 * no-op polyfill even when nothing here asserts on them directly.
 */
if (!window.HTMLElement.prototype.hasPointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
}
if (!window.HTMLElement.prototype.setPointerCapture) {
  window.HTMLElement.prototype.setPointerCapture = () => {};
}
if (!window.HTMLElement.prototype.releasePointerCapture) {
  window.HTMLElement.prototype.releasePointerCapture = () => {};
}
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
if (!("ResizeObserver" in window)) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test-only polyfill
  window.ResizeObserver = ResizeObserverMock;
}
