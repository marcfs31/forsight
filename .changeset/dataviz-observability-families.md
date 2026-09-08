---
"@marcfs31/fors-observability-design-system": minor
---

Two new component families for dashboards, and the tokens behind them.

**Data visualization** — `LineChart` (lines or a single area, with gaps for missing samples), `BarChart` (grouped or stacked, zero-baselined), `Sparkline`, `BarList`, `DonutChart`, `Heatmap`, `Gauge`, plus `ChartFrame` / `ChartLegend` / `ChartTooltip` for building a plot this package doesn't ship. Everything is drawn as SVG from exported geometry helpers (`niceScale`, `linePath`, `areaPath`, `barPath`, `arcPath`, `project`, `polar`, `formatCompact`, `formatDuration`, `formatPercent`, `seriesFill`/`seriesStroke`/`seriesBg`) — no charting dependency is added.

**Observability** — `StatCard`, `Delta`, `StatusDot`, `UptimeBar`, `LogStream`, `Timeline`, `TraceWaterfall`, `TimeRange`.

**Tokens** — eight categorical chart-series slots, `--fors-viz-1` … `--fors-viz-8`, per theme, mapped into both Tailwind entries as `fill-viz-*` / `stroke-viz-*` / `bg-viz-*`. The slot order is the colorblind-safety mechanism (adjacent pairs clear the CVD and normal-vision separation floors in both themes) and is pinned, along with the 3:1 non-text contrast bar, by `src/tokens/__tests__/contrast.test.ts`.

Accessibility notes worth knowing before using these: every plot also renders its data as a visually hidden table (`Heatmap` and `TraceWaterfall` _are_ real tables); the hover readout is reachable by keyboard (Arrow/Home/End, Escape to dismiss) and announced through a polite live region; and identity is never carried by color alone — legends, status words, delta arrows and printed values do that work.
