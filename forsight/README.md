# forsight

A self-contained observability agent: one binary that collects, stores, and
serves — no Docker, no Prometheus, no Grafana required to get a working
observability platform.

- **Host metrics** — CPU, memory, disk, network, uptime, via
  [gopsutil](https://github.com/shirou/gopsutil). Works on any OS Go
  supports, with zero configuration.
- **Process metrics** — per-process CPU and RSS for the busiest processes,
  on by default (`--disable-proc` to skip).
- **Docker container metrics** — per-container CPU/memory, auto-discovered
  from the local Docker daemon if one is reachable; simply doesn't register
  if not (a laptop with no Docker running still works fine).
- **OpenTelemetry ingestion** — a standard OTLP/HTTP receiver
  (`/v1/metrics`, `/v1/traces`, `/v1/logs`) so any app instrumented with an
  OTel SDK can point its exporter at forsight with no forsight-specific
  integration. Gauge, Sum, Histogram, ExponentialHistogram and Summary, plus
  log records, over protobuf or JSON bodies.
- **Prometheus scraping** — `--scrape` any exposition endpoint, **and** a
  default probe of well-known local exporters (`node_exporter` :9100,
  Prometheus :9090, windows_exporter :9182, process-exporter :9273). A miss
  is silence. `--disable-autoscrape` turns the probe off.
- **StatsD / DogStatsD** — listens on `:8125` by default so a bare install
  receives them. `--disable-statsd` turns it off; a bind failure is a
  warning, not a crash.
- **Forseer** — AI/ML lives in the sibling [`forseer/`](../forseer/) folder.
  Statistical detectors (z-score, CUSUM, log templates, slow spans, process
  culprits) are always on. Optional Grok narrative when `XAI_API_KEY` is set.
- **Kubernetes** — the [DaemonSet manifest](deploy/k8s/daemonset.yaml) runs
  this exact binary on every node, reusing the same host/Docker collectors
  (see the manifest's own comments for how and why).
- **Storage and dashboard, built in** — an embedded, retention-bounded store
  and a real dashboard (built on
  [`@marcfs31/forsight`](..), the design system this
  repo also publishes) served from the same process. No separate database,
  no separate frontend server. In-memory by default; add `--store badger` for
  a store that survives a restart (see below).

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/marcfs31/forsight/main/forsight/install.sh | sh
forsight run
```

Downloads the right binary for your OS/architecture, and — on Linux, run as
root — registers and starts a systemd service. Everywhere else, `forsight run`
starts it directly. See [install.sh](install.sh) for the env vars that
control the install location and version.

Then open `http://localhost:8080` for the dashboard.

## Why Go

Every product this agent is modeled on is written in Go: Prometheus and
`node_exporter`, Grafana Alloy, the OpenTelemetry Collector, Loki, the
Datadog Agent — and Kubernetes itself, which is why `client-go`-adjacent
tooling and single-static-binary distribution are such a natural fit here.
Go produces one dependency-free binary per OS/arch (no runtime, no libc
concerns), which is what makes `curl | sh` installation actually work, and
its standard library plus `gopsutil`/`go.opentelemetry.io/proto/otlp`/
`github.com/moby/moby` cover this project's whole surface without exotic
dependencies. Rust (Datadog's own Vector) or C++ (Dynatrace OneAgent) would
both beat Go on raw memory footprint, but at real cost to how fast a project
covering four different target environments can be built correctly — see the
project's planning notes for the full comparison.

## CLI

```
forsight run [flags]
    --addr string                address to serve on (default ":8080")
    --retention duration         how long the store retains data, memory or Badger alike (default 1h)
    --store string                storage backend: "memory" (default, resets on restart)
                                 or "badger" (persists to --data-dir, survives a restart)
    --data-dir string             directory for the Badger database when --store=badger
                                 (default "./forsight-data"); ignored otherwise
    --collect-interval duration  how often pull-based collectors poll (default 10s)
    --disable-docker             skip the Docker collector even if a daemon is reachable
    --disable-otlp               don't mount the OTLP ingest endpoints
    --disable-proc               skip per-process CPU/memory collection
    --disable-statsd             don't listen for StatsD/DogStatsD
    --disable-autoscrape         don't probe well-known local Prometheus exporters
    --scrape string              Prometheus exposition endpoint to scrape, repeatable;
                                 optionally prefixed with a job name
                                 (--scrape node=http://localhost:9100/metrics)
    --statsd-addr string         StatsD/DogStatsD UDP listen address (default :8125)
    --log-file string            log file to tail into the store (repeatable)

forsight version
```

### Persistent storage (`--store badger`)

By default `forsight run` stores everything in memory: fast, zero setup, and
gone on restart. Pass `--store badger --data-dir /path/to/dir` to persist
metrics, spans, and logs to an embedded [Badger](https://github.com/dgraph-io/badger)
key-value database instead — same query semantics (time-range + exact-label
match, retention-based pruning), same `Store` interface, so it's a drop-in
swap and nothing else about `run` changes. `--data-dir` defaults to
`./forsight-data` and is created if it doesn't exist; `--retention` governs
Badger's per-entry TTL the same way it governs MemoryStore's pruning.
`internal/store/badger.go`'s doc comment covers the key encoding and why it's
shaped the way it is.

## HTTP surface

| Path                                    | Method | What                                                    |
| ---------------------------------------- | ------ | -------------------------------------------------------- |
| `/`                                      | GET    | The dashboard                                             |
| `/healthz`                               | GET    | `{"status":"ok"}`                                          |
| `/api/v1/metrics?name=&since=&label.<k>=<v>` | GET | Query stored metrics (all filters optional)             |
| `/api/v1/traces?service=&traceId=&since=`    | GET | Query stored spans                                        |
| `/api/v1/logs?since=&source=&severity=`       | GET | Query stored log entries                                  |
| `/api/v1/forseer/insights`                   | GET | Current Forseer findings (always on, no API key)          |
| `/api/v1/forseer/clusters`                   | GET | Drain-style log templates                                 |
| `/api/v1/forseer/budget`                     | GET | Error-log burn against a 1% SLO (ErrorBudget)             |
| `/api/v1/forseer/timeline`                   | GET | Stitched incident events (Timeline)                       |
| `/api/v1/forseer/query?q=`                   | GET | Phrase → FilterBar facets                                 |
| `/api/v1/forseer/summary`                    | GET | Grok paragraph when `XAI_API_KEY` is set; else disabled   |
| `/v1/metrics`                            | POST   | OTLP/HTTP metrics ingest (protobuf or JSON body)          |
| `/v1/traces`                             | POST   | OTLP/HTTP traces ingest (protobuf or JSON body)           |
| `/v1/logs`                               | POST   | OTLP/HTTP logs ingest (protobuf or JSON body)             |

Point any OpenTelemetry SDK's OTLP/HTTP exporter at `http://<host>:8080` and
it works unmodified — those are the standard OTLP paths every SDK already
uses by default.

## Architecture

```
forseer/                   AI/ML module imported by the agent (detectors + Grok)
forsight/
  main.go, cmd/            CLI (cobra): `run`, `version`
  internal/
    model/                 shared data shapes: Metric, Span, LogEntry
    collector/              the Collector interface + a scheduling Registry
      host/                 gopsutil — CPU/memory/disk/network/uptime
      proc/                  per-process CPU and RSS
      docker/                Docker API — per-container CPU/memory
      otlp/                  OTLP/HTTP receiver — metrics (all five types),
                             traces, and logs (protobuf or JSON)
      promscrape/            Prometheus exposition-format scraper + local discover
      statsd/                StatsD/DogStatsD UDP receiver
      filelog/               tail --log-file paths into LogEntry
    store/                  Store interface + MemoryStore (default) and BadgerStore
                             (--store badger) implementations, same query semantics
    api/                    HTTP server: query API, OTLP mount, embedded dashboard
  web/                      the dashboard — a small React app on the design system
  deploy/k8s/               DaemonSet manifest for cluster-wide deployment
  install.sh                 curl|sh installer
  Makefile                   build-web, build-go, build, release, dev, test, lint
```

**The "one host collector, four environments" trick**: rather than writing a
Kubernetes-specific collector, the [DaemonSet manifest](deploy/k8s/daemonset.yaml)
mounts the host's `/proc`/`/sys` into the pod and sets `HOST_PROC`/`HOST_SYS`
— the exact convention `node_exporter` itself uses — so the *same* host
collector code gets real node-level metrics with zero forsight-specific
Kubernetes code. See that manifest's comments for the Docker-socket caveat on
non-Docker-runtime clusters.

## Building from source

```bash
brew install go golangci-lint   # or your platform's equivalent
make build-go     # agent only — no Node needed, webdist/ falls back to a placeholder page
make build-web    # dashboard only — rebuilds the design system, then web/, then embeds it
make build        # both
make test         # go test ./...
make lint         # golangci-lint run ./...
make dev          # go run . run, against whatever's currently embedded
```

`internal/api/webdist/` (the dashboard's build output) is checked into git
deliberately, so a bare `go build`/`go test` always works without Node
installed at all — only refreshing the *real* dashboard after a change to
`web/` needs the JS toolchain. CI enforces that the checked-in copy actually
matches what `web/` currently builds (`.github/workflows/forsight-ci.yml`'s
`web` job) — bump it with `make build-web` and commit the diff.

## Releasing

No automated release pipeline yet (see Roadmap) — cut one by hand:

```bash
make release VERSION=v0.1.0
gh release create forsight-v0.1.0 dist/*.tar.gz --title "forsight v0.1.0"
```

`install.sh` expects that exact tag prefix (`forsight-vX.Y.Z`, distinct from
the npm package's own `vX.Y.Z` tags — this repo now ships two independently
versioned artifacts) and asset naming (`forsight_<os>_<arch>.tar.gz`).

## Scope: what's real vs. what's roadmap

**Built and verified working:** everything listed at the top of this file —
host and process metrics, Docker container metrics, OTLP metrics+traces+logs
ingestion, Kubernetes via the DaemonSet manifest, embedded in-memory storage,
persistent Badger-backed storage (`--store badger`), a real dashboard, and
Forseer statistical detectors. Verified by hand: ran the binary, watched real
host and Docker metrics flow through `/api/v1/metrics`, sent a real OTLP
protobuf payload and queried it back out, opened the dashboard in a browser
to confirm the chart, stat tiles, and container table render live data, and
— for the Badger store — ran with `--store badger --data-dir <dir>`, sent a
real OTLP metrics payload and let the host collector tick, queried the data
back out, killed the process, restarted it against the same `--data-dir`,
and confirmed every metric written before the restart (the OTLP payload and
every prior host-collector tick) was still there — not just that the code
compiles.

**Deliberately not built yet, flagged rather than silently skipped:**

- **Log file tailing/parsing.** OTLP log ingest (`POST /v1/logs`) and the
  query/dashboard surface are built; reading and parsing log *files* on disk
  (tail + pattern extraction) still deserves its own careful design.
- **Seasonal baselines and SLO error-budget forecast.** Forseer ships
  rolling z-score / CUSUM / log-template / slow-span detectors; hour-of-day
  baselines and **ErrorBudget** projection are next (see
  [`forseer/README.md`](../forseer/README.md)).
- **A real query language.** The API takes simple time-range + exact-label
  filters, not anything PromQL-equivalent.
- **Automated releases.** `make release` is manual; no CI job cuts and
  publishes a GitHub Release on tag push yet.
