---
"@marcfs31/forsight": patch
---

**Security fix:** the tree-shaking build plugin (`scripts/forsight-treeshake-plugin.ts`, added in the 4.0.0 named-import tree-shaking change) rewrote each source file with plain `.replace()` regexes over raw, untokenized text — with no awareness of comments or string/template literals — before handing the result to esbuild.

A source file containing a comment shaped like a `forwardRef`/`memo`/`cva` call could have `/* @__PURE__ */` inserted _inside_ that comment. Because the annotation itself contains `*/`, the insertion closed the real comment early, turning the remainder of it into live, executing top-level JavaScript in the built `dist/` bundle shipped to npm. The `displayName`-stripping pass had the same root cause: it could delete a line that merely looked like a `displayName` assignment from inside a multi-line template literal, corrupting that string's runtime value.

Both passes (plus the `forwardRef`-declaration scan used to rename render functions for DevTools) now run against a comment/string-aware "code mask" instead of raw text, so a match can never start inside a comment, string, or template literal. No public API changed; this only affects how `dist/` is built.

A regression test (`scripts/forsight-treeshake-plugin.test.ts`) reproduces the exact exploit shape end-to-end through the real esbuild toolchain and asserts the malicious payload never executes — confirmed to fail against the pre-fix code (the payload really did run) and pass against the fix.

No source file in this repository currently contains a comment or string that triggers this, so the dist bundle actually published in past releases (4.0.0 and earlier since 1084bdc) was not observed to already contain injected code — but the vulnerable build tooling itself was live and publishable from the moment it landed.
