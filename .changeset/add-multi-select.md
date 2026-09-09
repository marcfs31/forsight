---
"@marcfs31/fors-observability-design-system": minor
---

Add `MultiSelect` — the tag-picker sibling to `Combobox`'s single-select, composed from the same `Popover` + `Command` pairing. Selected options show as plain (non-interactive) chips inside the trigger — deliberately no per-chip remove button, since that would nest an interactive control inside the trigger `<button>`; removal happens by reopening the popover and unchecking. Picking an option leaves the popover open so multiple picks don't need reopening.
