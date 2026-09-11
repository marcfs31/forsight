---
"@marcfs31/forsight": patch
---

Enable named-import tree-shaking of the component barrel via a tsup esbuild plugin that marks `forwardRef`/`memo`/`cva` as `@__PURE__`, strips `displayName` assignments from the compiled output (source keeps them for DevTools during development), and names the render function passed to `forwardRef`.
