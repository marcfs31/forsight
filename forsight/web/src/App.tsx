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
} from "@marcfs31/forsight";
import { useMetrics, historyFor, latestValue, containerRows } from "./api";

const timeLabelFormat = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function formatPercent(v: number | undefined): string {
  return v === undefined ? "—" : `${v.toFixed(1)}`;
}

export default function App() {
  const metrics = useMetrics(5000);

  const cpuHistory = historyFor(metrics, "host.cpu.percent");
  const cpuLabels = cpuHistory.map((m) => timeLabelFormat.format(new Date(m.timestamp)));

  const cpu = latestValue(metrics, "host.cpu.percent");
  const memory = latestValue(metrics, "host.memory.percent");
  const disk = latestValue(metrics, "host.disk.percent");
  const containers = containerRows(metrics);

  const connected = metrics.length > 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <Heading as="h1" size="xl">
            forsight
          </Heading>
          <Text tone="secondary">Self-contained observability agent</Text>
        </div>
        <StatusDot
          status={connected ? "operational" : "unknown"}
          label={connected ? "Receiving data" : "Waiting for data…"}
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
    </div>
  );
}
