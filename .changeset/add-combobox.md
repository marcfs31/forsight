---
"@marcfs31/fors-observability-design-system": minor
---

Add `Combobox` — a searchable, filterable single-select for lists too long to scan un-filtered, composed from the existing `Popover` + `Command` primitives (no new dependency). Pass `options`, `value`/`onValueChange`, and an `aria-label` for the trigger's accessible name (it replaces the visible placeholder/value text for assistive tech, so word it as the field's purpose rather than a repeat of the placeholder).
