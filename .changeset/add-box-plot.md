---
"@marcfs31/fors-observability-design-system": minor
---

Add `BoxPlot` — a five-number summary (min/Q1/median/Q3/max) per category, for the latency/duration percentile spread `LineChart`/`BarChart` can't show. Like `LineChart` and unlike `BarChart`, its axis fits the data range rather than a zero baseline. Every box shares the neutral accent color (like `Histogram`/`Sparkline`) since it compares one metric's spread across categories, not several metrics against each other.
