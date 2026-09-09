---
"@marcfs31/fors-observability-design-system": minor
---

Add `Drawer` — an edge-anchored panel for row detail, filters, or focused editing next to the content it relates to, built on the same `@radix-ui/react-dialog` primitive as `Dialog`. `DrawerContent` takes a logical `side` (`"start"` | `"end"`, default `"end"`) that flips the physical edge automatically under `dir="rtl"`, the same technique already used by `Sidebar`'s mobile drawer.
