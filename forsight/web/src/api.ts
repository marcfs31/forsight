import { useEffect, useState } from "react";

export interface Metric {
  name: string;
  value: number;
  timestamp: string;
  labels?: Record<string, string>;
}

export type LogSeverity = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  severity: LogSeverity;
  source: string;
  message: string;
  labels?: Record<string, string>;
}

/** Polls /api/v1/metrics every `intervalMs` — the server's own MemoryStore
 * already retains the whole window, so one fetch returns full history for
 * every metric name, not just the latest point. */
export function useMetrics(intervalMs: number): Metric[] {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/v1/metrics");
        if (!res.ok) return;
        const data: Metric[] = await res.json();
        if (!cancelled) setMetrics(data);
      } catch {
        // Transient fetch failure — keep showing the last good snapshot
        // rather than clearing the dashboard to empty.
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return metrics;
}

/** Polls /api/v1/logs every `intervalMs` — same retention window as metrics. */
export function useLogs(intervalMs: number): LogEntry[] {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/v1/logs");
        if (!res.ok) return;
        const data: LogEntry[] = await res.json();
        if (!cancelled) setLogs(data);
      } catch {
        // Keep the last good snapshot on transient failure.
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return logs;
}

/** Every point for one metric name, oldest first (LineChart expects that order). */
export function historyFor(metrics: Metric[], name: string): Metric[] {
  return metrics
    .filter((m) => m.name === name)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/** The most recent value for a metric name, or undefined if none yet. */
export function latestValue(metrics: Metric[], name: string): number | undefined {
  const points = historyFor(metrics, name);
  return points.length > 0 ? points[points.length - 1].value : undefined;
}

export interface ContainerRow {
  id: string;
  name: string;
  image: string;
  cpuPercent?: number;
  memoryPercent?: number;
}

/** Groups the docker.* metrics by container into one row per container. */
export function containerRows(metrics: Metric[]): ContainerRow[] {
  const byId = new Map<string, ContainerRow>();
  for (const m of metrics) {
    if (!m.labels?.container_id) continue;
    const id = m.labels.container_id;
    const row = byId.get(id) ?? {
      id,
      name: m.labels.container_name ?? id,
      image: m.labels.image ?? "",
    };
    if (m.name === "docker.cpu.percent") row.cpuPercent = m.value;
    if (m.name === "docker.memory.percent") row.memoryPercent = m.value;
    byId.set(id, row);
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export interface ProcessRow {
  pid: string;
  name: string;
  cpuPercent?: number;
  rssBytes?: number;
}

/** Groups process.* metrics by pid into one row per process. */
export function processRows(metrics: Metric[]): ProcessRow[] {
  const byPid = new Map<string, ProcessRow>();
  for (const m of metrics) {
    if (!m.labels?.pid) continue;
    const pid = m.labels.pid;
    const row = byPid.get(pid) ?? { pid, name: m.labels.name ?? pid };
    if (m.name === "process.cpu.percent") row.cpuPercent = m.value;
    if (m.name === "process.memory.rss_bytes") row.rssBytes = m.value;
    byPid.set(pid, row);
  }
  return [...byPid.values()].sort((a, b) => (b.cpuPercent ?? 0) - (a.cpuPercent ?? 0));
}

export interface ForseerInsight {
  id: string;
  kind?: string;
  severity: string;
  title: string;
  description?: string;
  source?: string;
  metric?: string;
  value?: number;
  time: string;
  related?: string[];
}

export interface ForseerCluster {
  id: string;
  template: string;
  source: string;
  count: number;
  errorCount: number;
  lastSeen: string;
  sample: string;
}

export function useInsights(intervalMs: number): ForseerInsight[] {
  const [items, setItems] = useState<ForseerInsight[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/v1/forseer/insights");
        if (!res.ok) return;
        const data: ForseerInsight[] = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch {
        // keep last snapshot
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return items;
}

export function useClusters(intervalMs: number): ForseerCluster[] {
  const [items, setItems] = useState<ForseerCluster[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/v1/forseer/clusters");
        if (!res.ok) return;
        const data: ForseerCluster[] = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch {
        // keep last snapshot
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return items;
}

export interface Span {
  traceId: string;
  spanId: string;
  parentId?: string;
  name: string;
  service: string;
  start: string;
  duration: number;
  status: string;
}

export function useTraces(intervalMs: number): Span[] {
  const [items, setItems] = useState<Span[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/v1/traces");
        if (!res.ok) return;
        const data: Span[] = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch {
        // keep last snapshot
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return items;
}

export interface ForseerBudget {
  label: string;
  consumed: number;
  caption?: string;
  errors?: number;
  total?: number;
  warningAt?: number;
  dangerAt?: number;
}

export function useBudget(intervalMs: number): ForseerBudget {
  const [state, setState] = useState<ForseerBudget>({ label: "Error-log budget", consumed: 0 });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/v1/forseer/budget");
        if (!res.ok) return;
        const data = (await res.json()) as ForseerBudget;
        if (!cancelled && data) setState(data);
      } catch {
        // keep last snapshot
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return state;
}

export interface ForseerEvent {
  id: string;
  time: string;
  title: string;
  description?: string;
  tone?: string;
}

export function useTimeline(intervalMs: number): ForseerEvent[] {
  const [items, setItems] = useState<ForseerEvent[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/v1/forseer/timeline");
        if (!res.ok) return;
        const data: ForseerEvent[] = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch {
        // keep last snapshot
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return items;
}

export interface ForseerQueryFacet {
  key: string;
  label: string;
  value: string;
}

export interface ForseerQueryResult {
  facets: ForseerQueryFacet[];
  /** Whether the phrase was recognized at all. False for both "nothing
   * typed" and "typed something this grammar doesn't understand" — callers
   * that need to tell those apart should check the query text themselves
   * before calling this. */
  matched: boolean;
}

export async function queryForseer(q: string): Promise<ForseerQueryResult> {
  const res = await fetch("/api/v1/forseer/query?q=" + encodeURIComponent(q));
  if (!res.ok) return { facets: [], matched: false };
  const data = (await res.json()) as Partial<ForseerQueryResult>;
  return {
    facets: Array.isArray(data.facets) ? data.facets : [],
    matched: Boolean(data.matched),
  };
}

export function useSummary(intervalMs: number): { enabled: boolean; summary: string } {
  const [state, setState] = useState({ enabled: false, summary: "" });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/v1/forseer/summary");
        if (!res.ok) return;
        const data = (await res.json()) as { enabled?: boolean; summary?: string };
        if (!cancelled) {
          setState({ enabled: Boolean(data.enabled), summary: data.summary ?? "" });
        }
      } catch {
        // keep last snapshot
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return state;
}
