# botobs

A self-contained observability agent: one binary that collects, stores, and
serves — no Docker, no Prometheus, no Grafana required to get a working
observability platform.

- **Host metrics** — CPU, memory, disk, network, uptime, via
  [gopsutil](https://github.com/shirou/gopsutil). Works on any OS Go
  supports, with zero configuration.
- **Docker container metrics** — per-container CPU/memory, auto-discovered
  from the local Docker daemon if one is reachable; simply doesn't register
  if not (a laptop with no Docker running still works fine).
- **OpenTelemetry ingestion** — a standard OTLP/HTTP receiver
  (`/v1/metrics`, `/v1/traces`) so any app instrumented with an OTel SDK can
  point its exporter at botobs with no botobs-specific integration.
- **Kubernetes** — the [DaemonSet manifest](deploy/k8s/daemonset.yaml) runs
  this exact binary on every node, reusing the same host/Docker collectors
  (see the manifest's own comments for how and why).
- **Storage and dashboard, built in** — an embedded, retention-bounded store
  and a real dashboard (built on
  [`@marcfs31/fors-observability-design-system`](..), the design system this
  repo also publishes) served from the same process. No separate database,
  no separate frontend server.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/marcfs31/fors-observability-design-system/main/botobs/install.sh | sh
botobs run
```

Downloads the right binary for your OS/architecture, and — on Linux, run as
root — registers and starts a systemd service. Everywhere else, `botobs run`
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
botobs run [flags]
    --addr string                address to serve on (default ":8080")
    --retention duration         how long the in-memory store retains data (default 1h)
    --collect-interval duration  how often host/Docker collectors poll (default 10s)
    --disable-docker             skip the Docker collector even if a daemon is reachable
    --disable-otlp               don't mount the OTLP ingest endpoints

botobs version
```

## HTTP surface

| Path                                    | Method | What                                                    |
| ---------------------------------------- | ------ | -------------------------------------------------------- |
| `/`                                      | GET    | The dashboard                                             |
| `/healthz`                               | GET    | `{"status":"ok"}`                                          |
| `/api/v1/metrics?name=&since=&label.<k>=<v>` | GET | Query stored metrics (all filters optional)             |
| `/api/v1/traces?service=&traceId=&since=`    | GET | Query stored spans                                        |
| `/v1/metrics`                            | POST   | OTLP/HTTP metrics ingest (protobuf body)                  |
| `/v1/traces`                             | POST   | OTLP/HTTP traces ingest (protobuf body)                   |

Point any OpenTelemetry SDK's OTLP/HTTP exporter at `http://<host>:8080` and
it works unmodified — those are the standard OTLP paths every SDK already
uses by default.

## Architecture

```
botobs/
  main.go, cmd/            CLI (cobra): `run`, `version`
  internal/
    model/                 shared data shapes: Metric, Span, LogEntry
    collector/              the Collector interface + a scheduling Registry
      host/                 gopsutil — CPU/memory/disk/network/uptime
      docker/                Docker API — per-container CPU/memory
      otlp/                  OTLP/HTTP receiver — metrics (Gauge/Sum) + traces
    store/                  Store interface + an in-memory, retention-bounded impl
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
collector code gets real node-level metrics with zero botobs-specific
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
matches what `web/` currently builds (`.github/workflows/botobs-ci.yml`'s
`web` job) — bump it with `make build-web` and commit the diff.

## Releasing

No automated release pipeline yet (see Roadmap) — cut one by hand:

```bash
make release VERSION=v0.1.0
gh release create botobs-v0.1.0 dist/*.tar.gz --title "botobs v0.1.0"
```

`install.sh` expects that exact tag prefix (`botobs-vX.Y.Z`, distinct from
the npm package's own `vX.Y.Z` tags — this repo now ships two independently
versioned artifacts) and asset naming (`botobs_<os>_<arch>.tar.gz`).

## Scope: what's real vs. what's roadmap

**Built and verified working:** everything listed at the top of this file —
host metrics, Docker container metrics, OTLP metrics+traces ingestion,
Kubernetes via the DaemonSet manifest, embedded in-memory storage, and a real
dashboard. Verified by hand: ran the binary, watched real host and Docker
metrics flow through `/api/v1/metrics`, sent a real OTLP protobuf payload and
queried it back out, and opened the dashboard in a browser to confirm the
chart, stat tiles, and container table render live data — not just that the
code compiles.

**Deliberately not built yet, flagged rather than silently skipped:**

- **Log tailing/parsing.** `model.LogEntry` exists so the store/API shapes
  are already settled, but there's no collector producing it — file-tail +
  pattern extraction deserves its own careful design rather than being
  bolted on here.
- **Persistent storage.** The store is in-memory only, bounded by
  `--retention` (default 1h) — restart the process and history is gone. A
  `store.Store`-implementing Badger-backed store is the natural next step;
  the interface is already the seam for it.
- **Alerting rules.** No threshold/anomaly alerting on collected data yet.
- **A real query language.** The API takes simple time-range + exact-label
  filters, not anything PromQL-equivalent.
- **Automated releases.** `make release` is manual; no CI job cuts and
  publishes a GitHub Release on tag push yet.
- **OTLP Histogram/ExponentialHistogram/Summary metric types**, and
  OTLP/JSON request bodies (only protobuf, the default for every OTel SDK's
  HTTP exporter, is handled) — see `internal/collector/otlp`'s package doc.
