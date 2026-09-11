import { useMemo } from "react";
import {
  Heading,
  Text,
  StatCard,
  LineChart,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusDot,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  LogStream,
  AlertList,
  Timeline,
  BarList,
  type LogEntry as StreamLogEntry,
  type AlertListItem,
  type AlertSeverity,
  type TimelineItem,
  type TimelineTone,
  type ServiceStatus,
} from "@marcfs31/forsight";
import {
  useMetrics,
  useLogs,
  useInsights,
  useClusters,
  useSummary,
  historyFor,
  latestValue,
  containerRows,
  processRows,
  type LogEntry,
  type ForseerInsight,
} from "./api";

const timeLabelFormat = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function formatPercent(v: number | undefined): string {
  return v === undefined ? "—" : `${v.toFixed(1)}`;
}

function formatRss(bytes: number | undefined): string {
  if (bytes === undefined) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatInsightTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return timeLabelFormat.format(d);
}

function toStreamEntries(logs: LogEntry[]): StreamLogEntry[] {
  return [...logs]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((entry, i) => ({
      id: `${entry.timestamp}-${entry.source}-${i}`,
      timestamp: timeLabelFormat.format(new Date(entry.timestamp)),
      level: entry.severity,
      source: entry.source,
      message: entry.message,
    }));
}

function asAlertSeverity(value: string): AlertSeverity {
  if (value === "critical" || value === "warning" || value === "info") return value;
  return "info";
}

function toAlertItems(insights: ForseerInsight[]): AlertListItem[] {
  return insights.map((ins) => ({
    id: ins.id,
    severity: asAlertSeverity(ins.severity),
    title: ins.title,
    description: ins.description,
    time: formatInsightTime(ins.time),
    source: ins.kind ?? ins.source,
  }));
}

function toneFor(severity: string): TimelineTone {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  return "accent";
}

function toTimelineItems(insights: ForseerInsight[]): TimelineItem[] {
  return insights.map((ins) => ({
    id: `tl-${ins.id}`,
    time: formatInsightTime(ins.time),
    title: ins.title,
    description: ins.kind,
    tone: toneFor(ins.severity),
  }));
}

function statusFromInsights(connected: boolean, insights: ForseerInsight[]): ServiceStatus {
  if (!connected) return "unknown";
  if (insights.some((ins) => ins.severity === "critical")) return "outage";
  if (insights.some((ins) => ins.severity === "warning")) return "degraded";
  return "operational";
}

export default function App() {
  const metrics = useMetrics(5000);
  const logs = useLogs(5000);
  const insights = useInsights(5000);
  const clusters = useClusters(5000);
  const summary = useSummary(30000);

  const cpuHistory = historyFor(metrics, "host.cpu.percent");
  const cpuLabels = cpuHistory.map((m) => timeLabelFormat.format(new Date(m.timestamp)));

  const cpu = latestValue(metrics, "host.cpu.percent");
  const memory = latestValue(metrics, "host.memory.percent");
  const disk = latestValue(metrics, "host.disk.percent");
  const containers = containerRows(metrics);
  const processes = processRows(metrics).slice(0, 15);
  const streamEntries = useMemo(() => toStreamEntries(logs), [logs]);
  const errorCount = useMemo(
    () => logs.filter((entry) => entry.severity === "error").length,
    [logs]
  );
  const alertItems = useMemo(() => toAlertItems(insights), [insights]);
  const timelineItems = useMemo(() => toTimelineItems(insights), [insights]);
  const clusterBars = useMemo(
    () =>
      clusters.slice(0, 8).map((c) => ({
        label: c.template || c.id,
        value: c.count,
      })),
    [clusters]
  );

  const connected = metrics.length > 0 || logs.length > 0;
  const status = statusFromInsights(connected, insights);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <Heading as="h1" size="xl">
            forsight
          </Heading>
          <Text tone="secondary">
            Collects host, process, Docker, OTLP, StatsD, and local Prometheus — Forseer
            watches the stream
          </Text>
        </div>
        <StatusDot
          status={status}
          label={
            !connected
              ? "Waiting for data…"
              : status === "outage"
                ? "Forseer: critical"
                : status === "degraded"
                  ? "Forseer: warning"
                  : "Receiving data"
          }
        />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Host CPU" value={formatPercent(cpu)} unit="%" status="operational" />
        <StatCard label="Host memory" value={formatPercent(memory)} unit="%" status="operational" />
        <StatCard label="Host disk" value={formatPercent(disk)} unit="%" status="operational" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Host CPU over time</CardTitle>
        </CardHeader>
        <CardContent>
          {cpuHistory.length > 1 ? (
            <LineChart
              label="Host CPU percent over time"
              labels={cpuLabels}
              series={[{ name: "CPU %", values: cpuHistory.map((m) => m.value) }]}
              area
            />
          ) : (
            <EmptyState
              title="Collecting data"
              description="The chart fills in once a few collection ticks have landed."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forseer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {summary.enabled && summary.summary ? <Text>{summary.summary}</Text> : null}
          <AlertList
            label="Forseer insights"
            items={alertItems}
            emptyMessage="Forseer watches every metric, log template, and span against its own baseline. Spikes, regime shifts, log bursts, and slow traces show up here."
          />
          {timelineItems.length > 0 ? <Timeline items={timelineItems} /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Processes</CardTitle>
        </CardHeader>
        <CardContent>
          {processes.length === 0 ? (
            <EmptyState
              title="Collecting processes"
              description="Per-process CPU and RSS show up after the first couple of ticks."
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <caption className="sr-only">Busiest processes by CPU, with RSS</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>PID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>CPU %</TableHead>
                    <TableHead>RSS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes.map((p) => (
                    <TableRow key={p.pid}>
                      <TableCell>{p.pid}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{formatPercent(p.cpuPercent)}</TableCell>
                      <TableCell>{formatRss(p.rssBytes)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Containers</CardTitle>
        </CardHeader>
        <CardContent>
          {containers.length === 0 ? (
            <EmptyState
              title="No containers"
              description="No Docker daemon was reachable when forsight started, or nothing is running."
            />
          ) : (
            <Table>
              <caption className="sr-only">Running containers with CPU and memory usage</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Container</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>CPU %</TableHead>
                  <TableHead>Memory %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {containers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="text-fg-secondary">{c.image}</TableCell>
                    <TableCell>{formatPercent(c.cpuPercent)}</TableCell>
                    <TableCell>{formatPercent(c.memoryPercent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log templates</CardTitle>
        </CardHeader>
        <CardContent>
          {clusterBars.length === 0 ? (
            <EmptyState
              title="No log templates yet"
              description="OTLP logs are clustered into Drain-style templates. Bursts become Forseer insights."
            />
          ) : (
            <BarList items={clusterBars} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {errorCount === 0
              ? "No error logs in the current window."
              : `${errorCount} error log${errorCount === 1 ? "" : "s"} in the current window.`}
          </p>
          {streamEntries.length === 0 ? (
            <EmptyState
              title="No logs yet"
              description="POST OTLP logs to /v1/logs and they will appear here."
            />
          ) : (
            <LogStream label="Ingested logs" entries={streamEntries} maxHeight={360} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
