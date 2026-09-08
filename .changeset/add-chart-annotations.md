---
"@marcfs31/fors-observability-design-system": minor
---

Add an `annotations` prop to `LineChart` and `BarChart` — SLO-threshold (`value`) or deploy-marker (`label`) reference lines drawn over the plot, in a `neutral`/`accent`/`warning`/`danger` tone. Every annotation's text is folded into the plot's visually hidden description, so a threshold or marker is never sighted-only information. The shared `ChartAnnotation` type and its tone-to-class mapping (`ANNOTATION_TONE_CLASSES`) are exported for building a custom plot on `ChartFrame` with the same annotation styling.

(Note: this landed on `LineChart`/`BarChart` rather than `ChartFrame` itself — `ChartFrame` has no scale or category knowledge to place a reference line against, so the annotation geometry has to live where the scale does.)

Also adds the `"warning (as text) on bg"` and `"danger (as text) on bg"` pairings to the token contrast test suite, covering the annotation labels' text color drawn directly on the plot background.
