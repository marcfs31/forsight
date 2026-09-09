---
"@marcfs31/forsight": major
---

**Breaking: the package is renamed from `@marcfs31/fors-observability-design-system` to `@marcfs31/forsight`.** Every import path changes accordingly:

```diff
-import { Button } from "@marcfs31/fors-observability-design-system";
-import "@marcfs31/fors-observability-design-system/styles.css";
+import { Button } from "@marcfs31/forsight";
+import "@marcfs31/forsight/styles.css";
```

The same applies to the `/theme`, `/tailwind-preset`, `/tailwind.css`, and `/fonts.css` sub-paths. No component API, token, or behavior changes — this is a rename only. The GitHub repository is also renamed (`marcfs31/fors-observability-design-system` → `marcfs31/forsight`); GitHub redirects the old URL, but update any bookmarked links or CI references pointing at the old repo path.
