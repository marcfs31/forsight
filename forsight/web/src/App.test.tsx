import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import type { ForseerQueryFacet } from "./api";

/**
 * Regression coverage for the "Ask Forseer" NL-query box (App.tsx's submit
 * handler): it used to unconditionally overwrite `filters` with whatever
 * queryForseer() returned, silently wiping any chip the parse didn't itself
 * reproduce, with zero feedback when the parse understood nothing at all.
 * These tests mock every endpoint App() polls and drive the real submit
 * flow through Testing Library rather than unit-testing the merge helper in
 * isolation, since the bug was in how App wired the response into state.
 */

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: async () => body }) as ReturnType<typeof fetch>;
}

type QueryResult = { facets: ForseerQueryFacet[]; matched: boolean };

/** Stubs `fetch` for every endpoint App() calls on mount, plus a caller-supplied
 * responder for /api/v1/forseer/query so each test can script its own phrases. */
function installFetchMock(handleQuery: (q: string) => QueryResult) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.startsWith("/api/v1/forseer/query")) {
      const q = new URL(url, "http://localhost").searchParams.get("q") ?? "";
      return jsonResponse(handleQuery(q));
    }
    if (url.startsWith("/api/v1/forseer/budget")) {
      return jsonResponse({ label: "Error-log budget", consumed: 0 });
    }
    if (url.startsWith("/api/v1/forseer/summary")) {
      return jsonResponse({ enabled: false, summary: "" });
    }
    // metrics, logs, traces, forseer/insights, forseer/clusters,
    // forseer/timeline all render fine from an empty list.
    return jsonResponse([]);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

async function askForseer(user: ReturnType<typeof userEvent.setup>, phrase: string) {
  const input = screen.getByRole("textbox", { name: "Ask Forseer" });
  await user.clear(input);
  if (phrase) await user.type(input, phrase);
  await user.click(screen.getByRole("button", { name: "Apply" }));
}

describe("Ask Forseer query box", () => {
  it("merges a recognized query's facets into existing filters instead of replacing them", async () => {
    const fetchMock = installFetchMock((q) => {
      if (q === "logs from checkout-api") {
        return { facets: [{ key: "source", label: "Source", value: "checkout-api" }], matched: true };
      }
      if (q === "critical") {
        return { facets: [{ key: "status", label: "Status", value: "error" }], matched: true };
      }
      return { facets: [], matched: false };
    });
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    await askForseer(user, "logs from checkout-api");
    await screen.findByRole("button", { name: "Remove Source: checkout-api filter" });

    await askForseer(user, "critical");

    // The second, unrelated-key facet is added...
    await screen.findByRole("button", { name: "Remove Status: error filter" });
    // ...without wiping out the first submit's chip. A wholesale replace
    // (the pre-fix behavior) would have dropped this.
    expect(screen.getByRole("button", { name: "Remove Source: checkout-api filter" })).toBeInTheDocument();
  });

  it("overrides only the keys a query's facets touch, replacing a same-key chip rather than duplicating it", async () => {
    const fetchMock = installFetchMock((q) => {
      if (q === "warn") return { facets: [{ key: "status", label: "Status", value: "warn" }], matched: true };
      if (q === "critical") return { facets: [{ key: "status", label: "Status", value: "error" }], matched: true };
      return { facets: [], matched: false };
    });
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    await askForseer(user, "warn");
    await screen.findByRole("button", { name: "Remove Status: warn filter" });

    await askForseer(user, "critical");

    await screen.findByRole("button", { name: "Remove Status: error filter" });
    // Only one "Status" chip at a time — FilterBar's AND semantics can
    // never satisfy two conflicting status facets simultaneously.
    expect(screen.queryByRole("button", { name: "Remove Status: warn filter" })).not.toBeInTheDocument();
  });

  it("leaves existing filters untouched and shows feedback for an unrecognized query", async () => {
    const fetchMock = installFetchMock((q) => {
      if (q === "logs from checkout-api") {
        return { facets: [{ key: "source", label: "Source", value: "checkout-api" }], matched: true };
      }
      return { facets: [], matched: false };
    });
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    await askForseer(user, "logs from checkout-api");
    await screen.findByRole("button", { name: "Remove Source: checkout-api filter" });

    await askForseer(user, "banana banana banana");

    // The pre-existing chip survives an unrecognized submit...
    expect(screen.getByRole("button", { name: "Remove Source: checkout-api filter" })).toBeInTheDocument();
    // ...and the box says so instead of silently doing nothing.
    expect(await screen.findByText(/didn.t recognize that phrase/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Ask Forseer" })).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the supported-vocabulary hint by default, before any query is submitted", async () => {
    const fetchMock = installFetchMock(() => ({ facets: [], matched: false }));
    render(<App />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    expect(screen.getByText(/critical\/severe/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Ask Forseer" })).not.toHaveAttribute("aria-invalid", "true");
  });

  it("does not call the query endpoint or touch filters when submitted empty", async () => {
    const fetchMock = installFetchMock(() => ({ facets: [{ key: "status", label: "Status", value: "error" }], matched: true }));
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();

    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/api/v1/forseer/query"));
    expect(screen.queryByRole("button", { name: /^Remove /i })).not.toBeInTheDocument();
  });
});
