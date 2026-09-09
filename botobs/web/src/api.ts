import { useEffect, useState } from "react";

export interface Metric {
  name: string;
  value: number;
  timestamp: string;
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
