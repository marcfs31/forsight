import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "./components/Heading";
import { Text } from "./components/Text";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./components/Card";
import { StatusDot } from "./components/StatusDot";
import { AlertList, type AlertListItem } from "./components/AlertList";
import { Timeline, type TimelineItem } from "./components/Timeline";
import { BarList } from "./components/BarList";
import { LogStream, type LogEntry } from "./components/LogStream";
import { TraceWaterfall, type TraceSpan } from "./components/TraceWaterfall";
import { ErrorBudget } from "./components/ErrorBudget";
import { FilterBar, type FilterBarFacet, type FilterBarOption } from "./components/FilterBar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./components/Table";

/**
 * Forseer does not ship new widgets. It scores the agent's stream and lands
 * each finding on a component that already exists in this library. This
 * section is that mapping, with the same sample incident throughout.
 *
 * | Kind | Detector | Component |
 * | --- | --- | --- |
 * | `anomaly` | rolling z-score | AlertList |
 * | `changepoint` | CUSUM | Timeline |
 * | `log_burst` | Drain-lite templates | BarList + LogStream |
 * | `slow_span` | per-name duration z-score | TraceWaterfall |
 * | `culprit` | join host.cpu with process.cpu | Table |
 * | Grok narrative | SpaceXAI, optional | Card + Text |
 * | NL filter | phrase → facets | FilterBar |
 * | SLO burn | error-log rate vs 1% | ErrorBudget |
 */
const meta: Meta = {
  title: "Forsight/Forseer",
  parameters: {
    docs: {
      description: {
        component:
          "AI/ML from the Forseer module rendered through existing Forsight components — not a chatbot, and not a parallel widget set.",
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const FILTER_OPTIONS: FilterBarOption[] = [
  { facetKey: "service", facetLabel: "Service", value: "checkout-api", label: "checkout-api" },
  { facetKey: "service", facetLabel: "Service", value: "payments-api", label: "payments-api" },
  { facetKey: "env", facetLabel: "Environment", value: "production", label: "Production" },
  { facetKey: "status", facetLabel: "Status", value: "error", label: "Error" },
];

const INSIGHTS: AlertListItem[] = [
  {
    id: "anomaly-cpu",
    severity: "critical",
    title: "host.cpu.percent is 5.2σ from its baseline",
    description: "value 91.4 vs rolling mean; critical",
    source: "anomaly",
    time: "14:02",
  },
  {
    id: "log-burst",
    severity: "critical",
    title: "log template burst from checkout-api",
    description: '18 lines in the last minute matching "dial tcp <*>:<*>: i/o timeout"',
    source: "log_burst",
    time: "14:02",
  },
  {
    id: "slow-span",
    severity: "critical",
    title: "payment.charge is 6.1σ slower than its baseline",
    description: "980ms vs rolling mean 160ms on payments",
    source: "slow_span",
    time: "14:02",
  },
  {
    id: "culprit",
    severity: "warning",
    title: "checkout is using 74% CPU while the host is anomalous",
    description: "process ranked as a likely contributor to the host CPU spike",
    source: "culprit",
    time: "14:02",
  },
  {
    id: "changepoint",
    severity: "warning",
    title: "host.disk.percent changed regime",
    description: "CUSUM reached 5.4 (value 81 vs rolling mean 42)",
    source: "changepoint",
    time: "13:40",
  },
];

const CHANGEPOINTS: TimelineItem[] = [
  {
    id: "cp-1",
    time: "13:40",
    title: "host.disk.percent changed regime",
    description: "CUSUM — disk filling, not a one-tick spike",
    tone: "warning",
  },
  {
    id: "cp-2",
    time: "14:02",
    title: "host.cpu.percent crossed 5σ",
    description: "anomaly — coinciding with the checkout timeout burst",
    tone: "danger",
  },
  {
    id: "cp-3",
    time: "14:02",
    title: "payment.charge duration shifted",
    description: "slow_span — 980ms against a 160ms baseline",
    tone: "danger",
  },
];

const LOG_TEMPLATES = [
  { label: "dial tcp <*>:<*>: i/o timeout", value: 18 },
  { label: "readiness probe failed: connection refused", value: 7 },
  { label: "starting rollout <*>", value: 2 },
  { label: "4/4 pods ready, rollout complete", value: 1 },
];

const LOGS: LogEntry[] = [
  {
    id: "1",
    timestamp: "14:02:03",
    level: "info",
    message: "starting rollout 4f21a",
    source: "deployer",
  },
  {
    id: "2",
    timestamp: "14:02:19",
    level: "warn",
    message: "readiness probe failed: connection refused",
    source: "checkout-7f9",
  },
  {
    id: "3",
    timestamp: "14:02:22",
    level: "error",
    message: "dial tcp 10.4.1.22:5432: i/o timeout",
    source: "checkout-7f9",
  },
  {
    id: "4",
    timestamp: "14:02:24",
    level: "error",
    message: "dial tcp 10.4.1.22:5432: i/o timeout",
    source: "checkout-7f2",
  },
  {
    id: "5",
    timestamp: "14:02:31",
    level: "error",
    message: "payment.charge exceeded 800ms budget",
    source: "payments",
  },
];

const SLOW_SPANS: TraceSpan[] = [
  { id: "1", name: "POST /api/checkout", service: "edge", start: 0, duration: 1840 },
  { id: "2", name: "auth.verify", service: "identity", start: 12, duration: 96, depth: 1 },
  { id: "3", name: "cart.load", service: "checkout", start: 120, duration: 210, depth: 1 },
  { id: "4", name: "pricing.quote", service: "pricing", start: 340, duration: 420, depth: 1 },
  {
    id: "5",
    name: "payment.charge",
    service: "payments",
    start: 780,
    duration: 980,
    depth: 1,
    status: "error",
  },
];

const PROCESSES = [
  { pid: "1421", name: "checkout", cpu: "74.2", rss: "512 MB" },
  { pid: "881", name: "payments", cpu: "18.0", rss: "190 MB" },
  { pid: "44", name: "forsight", cpu: "2.1", rss: "48 MB" },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
      <Heading id={id} as="h2" size="sm" className="text-fg-secondary">
        {title}
      </Heading>
      {children}
    </section>
  );
}

function ForseerIncident() {
  const [filters, setFilters] = React.useState<FilterBarFacet[]>([
    { key: "service", label: "Service", value: "checkout-api" },
    { key: "status", label: "Status", value: "error" },
  ]);

  return (
    <main className="min-h-screen bg-ink-bg p-4 sm:p-8 lg:p-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Heading as="h1" size="lg">
              Forseer
            </Heading>
            <div className="mt-1 flex items-center gap-3">
              <StatusDot status="outage" label="Forseer: critical" />
              <Text size="sm" tone="muted">
                checkout-api · production
              </Text>
            </div>
          </div>
        </header>

        <Section id="forseer-narrative" title="Grok narrative → Card">
          <Card>
            <CardHeader>
              <CardTitle>Grok narrative</CardTitle>
              <CardDescription>
                Optional. SpaceXAI <code className="font-mono">grok-4.5</code> when{" "}
                <code className="font-mono">XAI_API_KEY</code> is set; statistical detectors run
                without it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Text>
                Checkout is timing out on Postgres at 10.4.1.22 while host CPU sits 5σ above its
                rolling baseline. The checkout process is the likely culprit (74% CPU).
                payment.charge is 6σ slow on the same window — check the payments span and the
                disk-fill changepoint from 13:40 before rolling forward.
              </Text>
            </CardContent>
          </Card>
        </Section>

        <Section id="forseer-filter" title="Natural-language filter → FilterBar">
          <Card>
            <CardHeader>
              <CardTitle>Mapped query</CardTitle>
              <CardDescription>
                “show error logs from checkout” becomes facets. Heuristic parse, no API key.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FilterBar
                label="Forseer query facets"
                filters={filters}
                onFiltersChange={setFilters}
                options={FILTER_OPTIONS}
              />
            </CardContent>
          </Card>
        </Section>

        <Section id="forseer-insights" title="Insights → AlertList">
          <AlertList label="Forseer insights" items={INSIGHTS} />
        </Section>

        <Section id="forseer-timeline" title="Changepoints → Timeline">
          <Card>
            <CardContent className="pt-6">
              <Timeline items={CHANGEPOINTS} />
            </CardContent>
          </Card>
        </Section>

        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <Section id="forseer-templates" title="Log templates → BarList">
            <Card>
              <CardHeader>
                <CardTitle>Drain-lite clusters</CardTitle>
                <CardDescription>UUID, IP, and numbers folded to {"<*>"}.</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList items={LOG_TEMPLATES} />
              </CardContent>
            </Card>
          </Section>
          <Section id="forseer-budget" title="SLO forecast → ErrorBudget">
            <Card>
              <CardHeader>
                <CardTitle>Projected burn</CardTitle>
                <CardDescription>
                  Detector is next. The component already encodes healthy / at-risk / critical from
                  consumed percent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorBudget
                  label="30-day error budget, checkout-api"
                  consumed={78}
                  caption="Forseer projects burn-through in 11 hours at the current error-log rate"
                />
              </CardContent>
            </Card>
          </Section>
        </div>

        <Section id="forseer-logs" title="Raw lines → LogStream">
          <Card>
            <CardContent className="pt-6">
              <LogStream
                label="Ingested logs in the insight window"
                entries={LOGS}
                maxHeight={240}
              />
            </CardContent>
          </Card>
        </Section>

        <Section id="forseer-trace" title="Slow span → TraceWaterfall">
          <Card>
            <CardHeader>
              <CardTitle>Related trace</CardTitle>
              <CardDescription>payment.charge is the 6σ outlier on this request.</CardDescription>
            </CardHeader>
            <CardContent>
              <TraceWaterfall label="POST /api/checkout — trace 9f2c41" spans={SLOW_SPANS} />
            </CardContent>
          </Card>
        </Section>

        <Section id="forseer-culprits" title="Culprits → Table">
          <Card>
            <CardHeader>
              <CardTitle>Processes on the hot host</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <caption className="sr-only">
                  Processes ranked by CPU while host CPU is anomalous
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>PID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>CPU %</TableHead>
                    <TableHead>RSS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PROCESSES.map((p) => (
                    <TableRow key={p.pid}>
                      <TableCell>{p.pid}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.cpu}</TableCell>
                      <TableCell>{p.rss}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Section>
      </div>
    </main>
  );
}

export const Incident: Story = {
  name: "Incident",
  parameters: {
    layout: "fullscreen",
    a11y: { options: { rules: { region: { enabled: true } } } },
  },
  render: () => <ForseerIncident />,
};

export const IncidentRTL: Story = {
  name: "Incident (RTL)",
  parameters: {
    layout: "fullscreen",
    a11y: { options: { rules: { region: { enabled: true } } } },
  },
  render: () => (
    <div dir="rtl">
      <ForseerIncident />
    </div>
  ),
};

export const Insights: Story = {
  name: "Insights → AlertList",
  render: () => (
    <div className="w-full max-w-lg p-4 sm:p-8">
      <AlertList label="Forseer insights" items={INSIGHTS} />
    </div>
  ),
};

export const Changepoints: Story = {
  name: "Changepoints → Timeline",
  render: () => (
    <div className="w-full max-w-lg p-4 sm:p-8">
      <Timeline items={CHANGEPOINTS} />
    </div>
  ),
};

export const LogTemplates: Story = {
  name: "Log templates → BarList",
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6 p-4 sm:p-8">
      <BarList items={LOG_TEMPLATES} />
      <LogStream label="Lines matching the top template" entries={LOGS} maxHeight={200} />
    </div>
  ),
};

export const SlowSpan: Story = {
  name: "Slow span → TraceWaterfall",
  render: () => (
    <div className="w-full max-w-3xl p-4 sm:p-8">
      <TraceWaterfall label="POST /api/checkout — trace 9f2c41" spans={SLOW_SPANS} />
    </div>
  ),
};

export const Culprits: Story = {
  name: "Culprits → Table",
  render: () => (
    <div className="w-full max-w-lg p-4 sm:p-8">
      <Table>
        <caption className="sr-only">Processes ranked by CPU while host CPU is anomalous</caption>
        <TableHeader>
          <TableRow>
            <TableHead>PID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>CPU %</TableHead>
            <TableHead>RSS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {PROCESSES.map((p) => (
            <TableRow key={p.pid}>
              <TableCell>{p.pid}</TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.cpu}</TableCell>
              <TableCell>{p.rss}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

export const Forecast: Story = {
  name: "SLO forecast → ErrorBudget",
  render: () => (
    <div className="w-72 p-4 sm:p-8">
      <ErrorBudget
        label="30-day error budget, checkout-api"
        consumed={78}
        caption="Forseer projects burn-through in 11 hours at the current error-log rate"
      />
    </div>
  ),
};

export const Quiet: Story = {
  name: "Quiet",
  render: () => (
    <div className="w-full max-w-lg p-4 sm:p-8">
      <AlertList
        label="Forseer insights"
        items={[]}
        emptyMessage="No anomalies — Forseer watches every metric, log template, and span against its own baseline."
      />
    </div>
  ),
};
