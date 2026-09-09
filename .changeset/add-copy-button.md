---
"@marcfs31/forsight": minor
---

Add `CopyButton` — an icon button that copies a value to the clipboard and briefly confirms it. The accessible name swaps to `copiedLabel` and a polite live region announces it too, so the confirmation reaches assistive tech even though nothing moves focus. Used by the upcoming `CodeBlock`; also useful standalone next to an API key or webhook URL.

Also adds the `"success (as text) on bg"` pairing to the token contrast test suite, covering the copied-state icon color.
