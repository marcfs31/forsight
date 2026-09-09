---
"@marcfs31/fors-observability-design-system": minor
---

Add `AlertList` — "what's firing right now": active and recently resolved alerts ranked by recency, complementing `Timeline` (full history) and `StatusDot` (a single point-in-time health read). Severity is always printed as a word via `Badge`, never color alone; a resolved alert dims and gets a "Resolved" badge without hiding what it was. Renders `EmptyState` when there are no alerts, and defaults to a polite live region (opt out via `announce={false}` for a firehose feed).

Also raises the JS bundle size-limit budget from 92 KB to 100 KB for this component-library-expansion batch (two new Radix deps — `alert-dialog`, `toggle-group` — plus several components composed from existing primitives).
