---
"@marcfs31/fors-observability-design-system": minor
---

Add `Histogram` — distribution of one metric across ordered ranges (request-duration buckets, payload-size buckets), built on the same `ChartFrame`/`niceScale`/`barPath` geometry as `BarChart`. Bars sit edge to edge (a hairline gap) since ranges are continuous, unlike `BarChart`'s discrete, gapped categories, and it uses the neutral accent color (like `Sparkline`/`Gauge`) since there's only ever one metric to show.
