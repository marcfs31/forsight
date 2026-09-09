---
"@marcfs31/forsight": major
---

**Breaking: the public API now uses the `forsight` name throughout.** The package rename in the previous major only moved the import path; this completes it in the API itself.

CSS custom properties — all 48 of them — lose the `--fors-` prefix for `--forsight-`:

```diff
-  --fors-accent: …;
-  --fors-ink-surface: …;
+  --forsight-accent: …;
+  --forsight-ink-surface: …;
```

Anything that reads a token directly (`var(--fors-accent)`, a `style` override of `--fors-font-sans` / `--fors-font-heading`, a custom theme that sets the palette) must be updated. Apps that only use the shipped components, `styles.css`, `tailwind.css` or the Tailwind preset need no change — the token utilities (`bg-accent`, `text-fg-muted`, …) keep their names.

The `@marcfs31/forsight/theme` entry renames its exports:

| Before                 | After                      |
| ---------------------- | -------------------------- |
| `applyForsTheme`       | `applyForsightTheme`       |
| `forsAntiFlashScript`  | `forsightAntiFlashScript`  |
| `ForsTheme`            | `ForsightTheme`            |
| `ForsAntiFlashOptions` | `ForsightAntiFlashOptions` |
| `FORS_THEMES`          | `FORSIGHT_THEMES`          |
| `FORS_PALETTES`        | `FORSIGHT_PALETTES`        |
| `ForsPalette`          | `ForsightPalette`          |

The Tailwind v3 preset's default export is now `forsightPreset` (it was `forsPreset`); the import path is unchanged.

**The stored theme preference resets once.** `applyForsightTheme` and `forsightAntiFlashScript` read and write `localStorage["forsight-theme"]` instead of `localStorage["fors-theme"]`, so a returning visitor falls back to the default (dark) on their first load after the upgrade and their next toggle sticks. No migration shim is shipped: the value is a UI preference, not data.

Storybook story titles move from `Fors/…` to `Forsight/…`, and the demo content in stories uses the new brand. No component API, token _value_, or rendered behavior changes.
