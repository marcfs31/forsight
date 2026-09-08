---
"@marcfs31/fors-observability-design-system": minor
---

Add `ComboChart` — bars and a line sharing one x-axis on independent scales (request volume + p99 latency, the APM-dashboard pattern), built on the same `ChartFrame`/`niceScale`/`barPath`/`linePath` geometry as `BarChart`/`LineChart`. Bar series always share a zero-baselined left axis; line series always share a right axis fit to their own data range; the visually hidden description calls out which series reads on which axis.

Also exports `splitAtGaps` (the `null`-gap-splitting helper `LineChart` already used internally, now shared with `ComboChart`'s line series) alongside the rest of the chart math — no behavior change to `LineChart` itself.
