---
"@marcfs31/fors-observability-design-system": minor
---

Add `FilterBar` — a faceted filter row for an observability dashboard header (service/env/status/whatever facets the data supports). Applied facets render as removable chips; "Add filter" opens a searchable, grouped list of everything not already applied, built on the same `Popover` + `Command` pairing `Combobox` uses. `filters` is controlled — the component owns only the chip/add-menu chrome, and the caller decides what applying a filter actually does.
