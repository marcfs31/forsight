---
"@marcfs31/forsight": minor
---

Add `sortDirection`/`onSort` to `TableHead` for sortable column headers: sets `aria-sort` and renders the header as a button with a direction indicator. Matches `Table`'s existing scope — it only renders and announces the sort state, it never sorts rows itself; compose it with your own state (or a headless table library) to actually reorder rows, as shown in the new `Sortable` story.
