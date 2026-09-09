---
"@marcfs31/fors-observability-design-system": minor
---

Add `AlertDialog` — a confirmation dialog for destructive or otherwise consequential actions (`@radix-ui/react-alert-dialog`). Unlike `Dialog`, it doesn't dismiss on an outside click and always returns focus to `AlertDialogCancel` on open, so a keyboard or screen-reader user lands on the safe choice first. `AlertDialogAction` defaults to the `danger` `Button` variant and accepts `variant`/`size` overrides for non-destructive confirmations.
