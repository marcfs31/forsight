---
"@marcfs31/fors-observability-design-system": minor
---

Add `JSONViewer` — a collapsible tree for structured data (log fields, trace/span attributes, request/response payloads). Every visible node is real text content, and collapsing a node removes its children from the DOM rather than hiding them, so assistive tech never lands on content the sighted view has hidden. It's a set of nested disclosure buttons (Tab + Enter/Space), not a full WAI-ARIA `tree` widget.

Also adds the `"accent (as text) on bg"` pairing to the token contrast test suite, covering the node-toggle hover state's background.
