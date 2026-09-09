---
"@marcfs31/fors-observability-design-system": minor
---

Add `ErrorBudget` — an SLO burn-down bar showing how much of an error budget is spent, read as "how much is left." Unlike `Gauge` (a bounded metric with a caller-judged `tone`), the status here (`healthy`/`at-risk`/`critical`) derives automatically from `warningAt`/`dangerAt` thresholds, since "72% of your error budget is gone" means roughly the same thing in any context. The status word is always printed via `Badge`, never carried by color alone, and the whole thing is exposed as an ARIA `meter`.
