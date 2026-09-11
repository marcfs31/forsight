/**
 * Regression coverage for the comment/string injection vulnerability in
 * forsight-treeshake-plugin.ts: the displayName-strip and PURE-annotation
 * passes used to run a plain `.replace()` over raw source text, with no
 * awareness of comments or string/template literals. A source file
 * containing a comment shaped like a `forwardRef` call could have
 * `/* @__PURE__ *\/` inserted *inside* that comment — and because that
 * annotation itself contains `*\/`, the insertion closed the real comment
 * early, turning the rest of it into live, executing top-level JavaScript
 * in the built `dist/` bundle. The fix (maskNonCode / maskGuardedReplace in
 * the plugin file) makes every regex-driven pass match against a code-only
 * mask instead of raw text, so a match can never start inside a comment or
 * string.
 *
 * Every fixture below is a small, fixed, hand-verified input/output pair —
 * an exact-string assertion fails on *any* unexpected structural change to
 * the transform's output for these adversarial cases, not just on the one
 * specific exploit shape.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { transformSourceForTreeshake } from "./forsight-treeshake-plugin";

const here = dirname(fileURLToPath(import.meta.url));
const e2eHarness = join(here, "__fixtures__", "treeshake-e2e-harness.mjs");

// The exact attack shape from the audit: a doc comment containing what
// looks like a forwardRef call, an IIFE, and a trailing stray `/*`. As real
// JS, this whole block is one ordinary, inert block comment — the closing
// `*/` on the last line is the *first* `*/` a real tokenizer finds.
const ADVERSARIAL_COMMENT_LINES = [
  "/**",
  " * React.forwardRef(0);(function(){ globalThis.__forsight_pwned__ = true; })();/*",
  " */",
];

describe("transformSourceForTreeshake — adversarial comment/string input", () => {
  it("never splices into a comment shaped like a forwardRef call (React.forwardRef)", () => {
    const input = [
      "const React = { forwardRef: (render) => render, memo: (c) => c };",
      "",
      ...ADVERSARIAL_COMMENT_LINES,
      "export const Widget = React.forwardRef(function Widget(props) {",
      "  return props.label;",
      "});",
      'Widget.displayName = "Widget";',
      "",
    ].join("\n");

    const expected = [
      "const React = { forwardRef: (render) => render, memo: (c) => c };",
      "",
      ...ADVERSARIAL_COMMENT_LINES,
      "export const Widget = /* @__PURE__ */ React.forwardRef(function Widget(props) {",
      "  return props.label;",
      "});",
      "",
    ].join("\n");

    const output = transformSourceForTreeshake(input);

    // The comment's original bytes are present, unmodified and contiguous —
    // the vulnerable version splits this exact substring by inserting text
    // in the middle of it.
    expect(output).toContain(ADVERSARIAL_COMMENT_LINES.join("\n"));
    // No new top-level statement was introduced from inside it: the payload
    // text appears nowhere except inside that still-intact comment.
    expect(output.split(ADVERSARIAL_COMMENT_LINES.join("\n")).join("")).not.toContain(
      "__forsight_pwned__"
    );
    // Full structural diff: the real, legitimate forwardRef call after the
    // comment is still correctly PURE-annotated — the fix isn't just "stop
    // touching anything near a comment".
    expect(output).toBe(expected);
  });

  it("never splices into a comment shaped like a memo call (React.memo)", () => {
    const commentLines = [
      "/**",
      " * React.memo(0);(function(){ globalThis.__forsight_pwned_memo__ = true; })();/*",
      " */",
    ];
    const input = [
      "const React = { forwardRef: (r) => r, memo: (c) => c };",
      "",
      ...commentLines,
      "export const Widget = React.memo(function Widget() {",
      "  return null;",
      "});",
      "",
    ].join("\n");
    const expected = [
      "const React = { forwardRef: (r) => r, memo: (c) => c };",
      "",
      ...commentLines,
      "export const Widget = /* @__PURE__ */ React.memo(function Widget() {",
      "  return null;",
      "});",
      "",
    ].join("\n");

    const output = transformSourceForTreeshake(input);
    expect(output).toContain(commentLines.join("\n"));
    expect(output.split(commentLines.join("\n")).join("")).not.toContain("__forsight_pwned_memo__");
    expect(output).toBe(expected);
  });

  it("never splices into a comment shaped like a cva call", () => {
    const commentLines = [
      "/**",
      " * cva(0);(function(){ globalThis.__forsight_pwned_cva__ = true; })();/*",
      " */",
    ];
    const input = [
      "const cva = (x) => x;",
      "",
      ...commentLines,
      'const styles = cva("base-class");',
      "",
    ].join("\n");
    const expected = [
      "const cva = (x) => x;",
      "",
      ...commentLines,
      'const styles = /* @__PURE__ */ cva("base-class");',
      "",
    ].join("\n");

    const output = transformSourceForTreeshake(input);
    expect(output).toContain(commentLines.join("\n"));
    expect(output.split(commentLines.join("\n")).join("")).not.toContain("__forsight_pwned_cva__");
    expect(output).toBe(expected);
  });

  it("never strips a displayName-shaped line from inside a template literal (lower-severity, same root cause)", () => {
    // A template literal containing example/generated source text with a
    // line that *looks* exactly like a top-level displayName assignment.
    // Only the genuine top-level assignment after it may be stripped.
    const input = [
      "const codeSample = `function Example() {",
      "  return null;",
      "}",
      'Example.displayName = "Example";',
      "`;",
      "",
      'RealComponent.displayName = "RealComponent";',
      "",
    ].join("\n");

    const expected = [
      "const codeSample = `function Example() {",
      "  return null;",
      "}",
      'Example.displayName = "Example";',
      "`;",
      "",
      "",
    ].join("\n");

    const output = transformSourceForTreeshake(input);
    // The template literal's runtime value must be byte-identical.
    expect(output).toContain(
      [
        "`function Example() {",
        "  return null;",
        "}",
        'Example.displayName = "Example";',
        "`",
      ].join("\n")
    );
    expect(output).toBe(expected);
  });
});

describe("transformSourceForTreeshake — still performs its intended transform", () => {
  it("PURE-annotates and names a real forwardRef arrow render function", () => {
    const input = [
      "const React = { forwardRef: (render) => render };",
      "",
      "export const Widget = React.forwardRef((props, ref) => {",
      "  return props.label;",
      "});",
      'Widget.displayName = "Widget";',
      "",
    ].join("\n");

    const expected = [
      "const React = { forwardRef: (render) => render };",
      "",
      "export const Widget = /* @__PURE__ */ React.forwardRef(function Widget(props, ref) {",
      "  return props.label;",
      "});",
      "",
    ].join("\n");

    expect(transformSourceForTreeshake(input)).toBe(expected);
  });

  it("does not double-annotate a call that already carries a PURE pragma", () => {
    const input = [
      "const React = { forwardRef: (render) => render };",
      "",
      "export const Widget = /* @__PURE__ */ React.forwardRef(function Widget(props) {",
      "  return props.label;",
      "});",
      "",
    ].join("\n");

    expect(transformSourceForTreeshake(input)).toBe(input);
  });
});

describe("forsightTreeshakePlugin — end-to-end through the real esbuild toolchain", () => {
  it("builds an adversarial file without ever executing the comment's payload", () => {
    // Spawned as a separate Node process — see treeshake-e2e-harness.mjs
    // for why esbuild's JS API can't be invoked directly from this file.
    const stdout = execFileSync(process.execPath, [e2eHarness], { encoding: "utf8" });
    const result = JSON.parse(stdout) as {
      built: string;
      pwned: boolean | null;
      widgetLoaded: boolean | null;
    };

    // Sanity check on the raw build output too: the exploit's telltale — a
    // PURE annotation landing inside the original comment text — must not
    // appear.
    expect(result.built).not.toContain(
      "React.forwardRef(0);(function(){ globalThis.__forsight_pwned__ = true; })();"
    );

    // The attack payload must never have run...
    expect(result.pwned).toBeNull();
    // ...while the rest of the (legitimate) module still executed normally
    // — proving this isn't a no-op check that "passes" because nothing ran
    // at all.
    expect(result.widgetLoaded).toBe(true);
  });
});
