---
"@marcfs31/fors-observability-design-system": minor
---

Add `CalendarHeatmap` — a GitHub-contributions-style year-in-review activity calendar for incident or deploy frequency by day. Unlike `Heatmap` (a density matrix you've already arranged into rows/columns), it takes a flat, unordered list of `{ date, value }` days and buckets them into weeks (columns) and weekdays (rows) itself, then hands that grid to `Heatmap` — so it gets the same real `<table>`, five-step intensity scale, and legend. A date with no entry renders as an untracked (empty) cell, distinct from a tracked day whose count is zero.
