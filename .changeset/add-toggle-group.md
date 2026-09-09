---
"@marcfs31/fors-observability-design-system": minor
---

Add `ToggleGroup` / `ToggleGroupItem` — a segmented set of pressed-button options (view-mode switches, chart-type toggles, density controls), built on `@radix-ui/react-toggle-group`. `type="single"` exposes `role="radiogroup"`/`role="radio"` (same roles as `RadioGroup`, styled as a connected button row); `type="multiple"` exposes `role="toolbar"` with independently `aria-pressed` buttons. Arrow/Home/End move a roving focus between items; Space/Enter or a click selects.
