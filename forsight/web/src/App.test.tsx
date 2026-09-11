import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

type FetchResponses = Record<string, unknown>;

/**
 * Routes the mocked global fetch by pathname (query strings are stripped, so
 * `/api/v1/forseer/query?q=...` still matches `/api/v1/forseer/query`).
 * Anything not listed 404s, which every polling hook in api.ts already
 * treats the same as a transient failure: keep the last snapshot.
 */
function mockFetch(responses: FetchResponses) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      const path = url.split("?")[0];
      if (path in responses) {
        return new Response(JSON.stringify(responses[path]), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response("", { status: 404 });
    })
  );
}

// Every hook App() mounts polls once on the first render; stub them all to
// an empty-but-successful response so a test only has to override the one
// endpoint it cares about.
const emptyEndpoints: FetchResponses = {
  "/api/v1/metrics": [],
  "/api/v1/logs": [],
  "/api/v1/traces": [],
  "/api/v1/forseer/insights": [],
  "/api/v1/forseer/clusters": [],
  "/api/v1/forseer/summary": { enabled: false, summary: "" },
  "/api/v1/forseer/budget": { label: "Error-log budget", consumed: 0 },
  "/api/v1/forseer/timeline": [],
};

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Finding 1 (MEDIUM): the Forseer narrative slot used to render nothing at
  // all when XAI_API_KEY is unset — the documented, common default — unlike
  // every other empty/disabled state on the page.
  it("shows a muted disabled note instead of nothing when the AI narrative is off", async () => {
    mockFetch(emptyEndpoints);
    render(<App />);

    expect(
      await screen.findByText("AI narrative disabled — set XAI_API_KEY to enable")
    ).toBeInTheDocument();
  });

  it("renders the summary, not the disabled note, once the AI narrative is enabled", async () => {
    mockFetch({
      ...emptyEndpoints,
      "/api/v1/forseer/summary": { enabled: true, summary: "Everything looks steady." },
    });
    render(<App />);

    expect(await screen.findByText("Everything looks steady.")).toBeInTheDocument();
    expect(
      screen.queryByText("AI narrative disabled — set XAI_API_KEY to enable")
    ).not.toBeInTheDocument();
  });

  // Finding 2 (MEDIUM): Budget.SLO was already sent by the backend but the
  // frontend's ForseerBudget type dropped it silently. Confirms the value
  // from the API response actually reaches the rendered ErrorBudget label.
  it("shows the error-log SLO from the budget API response", async () => {
    mockFetch({
      ...emptyEndpoints,
      "/api/v1/forseer/budget": { label: "Error-log budget", consumed: 10, slo: 0.02 },
    });
    render(<App />);

    expect(await screen.findByText(/2% SLO/)).toBeInTheDocument();
  });

  // Finding 3 (LOW): the Timeline section rendered nothing at all — not even
  // a placeholder — with no stitched events, unlike every sibling panel.
  it("shows the Timeline EmptyState when there are no stitched events", async () => {
    mockFetch(emptyEndpoints);
    render(<App />);

    expect(await screen.findByText("No timeline events yet")).toBeInTheDocument();
  });

  it("renders Timeline items instead of the empty state once events land", async () => {
    mockFetch({
      ...emptyEndpoints,
      "/api/v1/forseer/timeline": [
        {
          id: "evt-1",
          time: "2026-01-01T00:00:00Z",
          title: "CPU spike",
          description: "anomaly",
          tone: "danger",
        },
      ],
    });
    render(<App />);

    expect(await screen.findByText("CPU spike")).toBeInTheDocument();
    expect(screen.queryByText("No timeline events yet")).not.toBeInTheDocument();
  });
});
