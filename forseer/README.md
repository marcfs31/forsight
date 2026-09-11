# Forseer

All AI and ML that sits on top of Forsight lives here. The observability
agent (`forsight/`) collects; Forseer *interprets*.

No extra process: `forsight run` is enough. Statistical detection needs no
API key. Optional Grok narrative uses SpaceXAI (`XAI_API_KEY`).

| Path | What |
| --- | --- |
| `.` (this Go module) | Detectors compiled into the agent |
| [`python/`](python/) | Training, notebooks, local models. They talk to the agent over `/api/v1/*`. |

## What the agent serves

| Path | Needs key | What |
| --- | --- | --- |
| `GET /api/v1/forseer/insights` | no | Open findings, critical first |
| `GET /api/v1/forseer/clusters` | no | Drain-style log templates |
| `GET /api/v1/forseer/budget` | no | Error-log burn vs a 1% SLO |
| `GET /api/v1/forseer/timeline` | no | Stitched incident events |
| `GET /api/v1/forseer/query?q=` | no | Phrase → FilterBar facets |
| `GET /api/v1/forseer/summary` | `XAI_API_KEY` | Grok paragraph; otherwise `{"enabled":false}` |

## Detectors that ship, and the component they drive

Every detector is chosen because a Forsight design-system component already
exists for that shape of answer. Forseer never invents a new widget.

| Kind | Method | Why it is ML/stats, not a threshold | Dashboard component |
| --- | --- | --- | --- |
| `anomaly` | Welford online mean/variance, 3σ / 5σ | The baseline is the series itself, not a hardcoded CPU% | **AlertList** (severity vocabulary is identical) |
| `changepoint` | CUSUM on the same z-scores | Catches a *shift* that a single spike detector misses (disk filling, leak) | **Timeline** |
| `log_burst` | Drain-lite templates (UUID/IP/number → `<*>`) + short-window volume | Turns a firehose into "this pattern just exploded" | **BarList** (ranked templates) + **LogStream** (raw lines) |
| `slow_span` | Per `(service, span name)` duration z-score | "This endpoint is slow *for itself*", not vs a global 200ms SLO | **TraceWaterfall** (related trace id) |
| `culprit` | Join a `host.cpu` anomaly with `process.cpu.percent` | Answers *which process* when the host is hot | **Table** (process rows) |
| Grok narrative | SpaceXAI `grok-4.5` | Stitches the above into four sentences an on-call can read | **Card** + **Text** |
| error-log budget | error/total vs 1% SLO | **ErrorBudget** |
| incident stitch | insights + related critical path | **Timeline** |
| NL filter | phrase → facets (`error logs from checkout`) | **FilterBar** |
| hour-of-day baseline | separate z-score per hour for host/docker series | **AlertList** (same findings, less night/day false fire) |
| critical path | walk error leaf to root | **TraceWaterfall** via `related` |

`Insight.severity` is `critical` / `warning` / `info` on purpose: those are
`AlertListItem.severity` values. `Insight.kind` is how the dashboard picks
Timeline vs AlertList vs BarList.

## Why these, not a chatbot

A generic "ask the dashboard" box would sit on **Combobox** / **FilterBar**
and ignore the rest of the library. The useful work is *scoring the stream
and landing each score on the component that already knows how to show it*:

- Alerts that page belong on **AlertList**, not a paragraph.
- Regime changes belong on **Timeline**, next to deploys later.
- Repeated logs belong on **BarList**, with the raw feed still on **LogStream**.
- Slow traces belong on **TraceWaterfall**, not a table of durations.
- A burned SLO belongs on **ErrorBudget**, not a chatbot that restates the
  burn in prose.

## Shipped since the table below was first written

Seasonal (hour-of-day) baselines, the NL-filter → FilterBar facets, incident
stitching onto Timeline, and trace critical-path → TraceWaterfall are all
built — see the detector table above (`seasonal baseline`, `NL filter`,
`incident stitch`, `critical path` rows). `Engine.Budget()` reads the current
error-log burn against a 1% SLO for **ErrorBudget**; what is NOT built yet is
the *forecast* — projecting that burn forward, not just reading it now (see
the table below).

## Next (stay in this folder)

| Idea | Method | Component |
| --- | --- | --- |
| Error-budget forecast | linear / Holt projection of error-log rate vs an SLO, on top of the current-burn read `Engine.Budget()` already does | **ErrorBudget** |
| Multivariate outlier | Isolation Forest in `python/`, scores POSTed back | **AlertList** |

Do not put model weights or API keys in this repo. Python jobs that need
numpy/a trainer stay under `python/` and read `/api/v1/*`; they do not
belong in the static `forsight` binary.
