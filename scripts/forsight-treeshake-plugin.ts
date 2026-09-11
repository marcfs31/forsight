import type { Plugin, Loader } from "esbuild";
import fs from "node:fs";
import path from "node:path";

/**
 * Enable named-import tree-shaking of the compiled barrel.
 *
 * Consumers importing `{ Button }` from the package were paying for the entire
 * library because every `React.forwardRef(...)` call and every
 * `X.displayName = "..."` assignment is a top-level side effect. This plugin
 * rewrites each src module as esbuild loads it:
 *   1. prefix forwardRef / memo / cva with a PURE annotation
 *   2. drop bare displayName assignments (kept in source on disk for DevTools
 *      during local development / Storybook)
 *   3. rewrite the arrow render function to a named function expression so
 *      React DevTools still resolves a real name after displayName is gone
 *      (React uses render.name when type.displayName is unset).
 */

function skipWs(s: string, i: number): number {
  while (i < s.length && /\s/.test(s[i])) i++;
  return i;
}

function matchBalanced(s: string, i: number, open: string, close: string): number {
  if (s[i] !== open) throw new Error(`expected ${open} at ${i}`);
  let depth = 0;
  let str = null;
  let escape = false;
  let lineComment = false;
  let blockComment = false;
  for (; i < s.length; i++) {
    const c = s[i];
    const next = s[i + 1];
    if (lineComment) {
      if (c === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (c === "*" && next === "/") {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (str) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      str = c;
      continue;
    }
    if (c === "/" && next === "/") {
      lineComment = true;
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      blockComment = true;
      i++;
      continue;
    }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`unbalanced ${open}${close}`);
}

/**
 * Build a same-length "mask" of `s`: genuine code characters pass through
 * unchanged, while everything lexically inside a line comment, a block
 * comment, or a string/template literal is replaced with a space. Newlines
 * are preserved so `^`/`$`/the `m` flag keep matching real line breaks.
 *
 * The one exception is a block comment whose entire trimmed content is the
 * `@__PURE__` pragma — esbuild's own tree-shaking annotation, which this
 * file inserts and must also be able to *see* again (so it doesn't
 * double-annotate an already-PURE call). That exact comment passes through
 * unmasked; every other comment — including one that merely contains the
 * substring "@__PURE__" alongside anything else — is fully blanked, so
 * there's no way to smuggle extra bytes past the exemption.
 *
 * This is what makes it safe to run a regex against the *mask* instead of
 * against raw source text below: a match can only start inside genuine
 * code, never inside a comment or string that merely looks like a
 * `forwardRef` call or a `displayName` assignment. Previously, a plain
 * `.replace()` over raw text could match text embedded in a comment;
 * inserting `/* @__PURE__ *\/` there closed the *real* comment early and
 * turned the remainder of it into live, executing top-level JavaScript in
 * the built bundle.
 *
 * `'...'`/`"..."` strings are masked only when `maskQuotedStrings` is true
 * (the default). The displayName-strip pass below needs it *off*: its own
 * pattern is meant to match into the quoted string that is a real
 * displayName assignment's value (`Foo.displayName = "Foo";`), so that
 * string's quotes and content must stay visible as ordinary code. This is
 * still safe with `^`/the `m` flag: unlike a template literal, a plain
 * quoted string can never contain a real, unescaped newline in valid JS, so
 * there is no way for it to smuggle a fake "start of line" the way a
 * multi-line template literal can — which is exactly what stays masked
 * (`` ` ``, below, is unconditional).
 */
function maskNonCode(s: string, options: { maskQuotedStrings?: boolean } = {}): string {
  const maskQuotedStrings = options.maskQuotedStrings ?? true;
  const PURE_PRAGMA_BODY = /^\s*@__PURE__\s*$/;
  let out = "";
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const next = s[i + 1];

    if (c === "/" && next === "/") {
      let j = i + 2;
      while (j < s.length && s[j] !== "\n") j++;
      out += s.slice(i, j).replace(/[^\n]/g, " ");
      i = j;
      continue;
    }

    if (c === "/" && next === "*") {
      const closeAt = s.indexOf("*/", i + 2);
      const end = closeAt === -1 ? s.length : closeAt + 2;
      if (closeAt !== -1 && PURE_PRAGMA_BODY.test(s.slice(i + 2, closeAt))) {
        out += s.slice(i, end); // keep the PURE pragma itself visible/matchable
      } else {
        out += s.slice(i, end).replace(/[^\n]/g, " ");
      }
      i = end;
      continue;
    }

    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      let j = i + 1;
      let escape = false;
      for (; j < s.length; j++) {
        const cj = s[j];
        if (escape) escape = false;
        else if (cj === "\\") escape = true;
        else if (cj === quote) {
          j++;
          break;
        }
      }
      const span = s.slice(i, j);
      out += quote === "`" || maskQuotedStrings ? span.replace(/[^\n]/g, " ") : span;
      i = j;
      continue;
    }

    out += c;
    i++;
  }
  return out;
}

/**
 * Run `re` (must have the `g` flag) against a code-only mask of `text` and
 * splice `replacer`'s output into the *original* `text` at each match —
 * never into the mask itself. Guarantees `re` can never match, and this can
 * never rewrite, anything lexically inside a comment or template literal
 * (and, unless `maskQuotedStrings` is set to false, a `'...'`/`"..."`
 * string either).
 */
function maskGuardedReplace(
  text: string,
  re: RegExp,
  replacer: (match: RegExpExecArray) => string,
  options: { maskQuotedStrings?: boolean } = {}
): string {
  const mask = maskNonCode(text, options);
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(mask)) !== null) {
    out += text.slice(last, m.index);
    out += replacer(m);
    last = m.index + m[0].length;
    if (re.lastIndex === m.index) re.lastIndex++; // guard zero-length matches
  }
  out += text.slice(last);
  return out;
}

/** Match a TypeScript type-argument list starting at '<', or return i unchanged. */
function matchTypeArgs(s: string, i: number): number {
  if (i >= s.length || s[i] !== "<") return i;
  let depth = 0;
  let str = null;
  let escape = false;
  for (; i < s.length; i++) {
    const c = s[i];
    if (str) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      str = c;
      continue;
    }
    // Treat => as not involving type args; our callers only invoke this
    // immediately after forwardRef/memo, where '<' starts generics.
    if (c === "<") depth++;
    else if (c === ">") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return i;
}

/**
 * Scan a JSX / expression body that is not wrapped in braces or parens
 * (e.g. `=> <tbody ... />`). Stops at the first top-level ',' or ')' that
 * closes the surrounding forwardRef argument list.
 */
function scanJsxOrExpr(s: string, i: number): number {
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  let depthAngle = 0;
  let str = null;
  let escape = false;
  let lineComment = false;
  let blockComment = false;
  for (; i < s.length; i++) {
    const c = s[i];
    const next = s[i + 1];
    if (lineComment) {
      if (c === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (c === "*" && next === "/") {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (str) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      str = c;
      continue;
    }
    if (c === "/" && next === "/") {
      lineComment = true;
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      blockComment = true;
      i++;
      continue;
    }
    if (c === "(") depthParen++;
    else if (c === ")") {
      if (depthParen === 0 && depthBrace === 0 && depthBracket === 0 && depthAngle === 0) return i;
      depthParen--;
    } else if (c === "{") depthBrace++;
    else if (c === "}") depthBrace--;
    else if (c === "[") depthBracket++;
    else if (c === "]") depthBracket--;
    else if (c === "<") {
      // JSX tag open — only count when it looks like a tag (`<Foo`, `</`, `<>`)
      if (next && /[A-Za-z_/!]/.test(next)) depthAngle++;
    } else if (c === ">") {
      if (depthAngle > 0) depthAngle--;
    } else if (c === "/" && next === ">" && depthAngle > 0) {
      // self-closing handled when we see '>'
    } else if (
      (c === "," || c === ";") &&
      depthParen === 0 &&
      depthBrace === 0 &&
      depthBracket === 0 &&
      depthAngle === 0
    ) {
      return i;
    }
  }
  return s.length;
}

function arrowToNamed(name: string, renderSrc: string): string {
  const rs = skipWs(renderSrc, 0);
  if (renderSrc.slice(rs, rs + 8) === "function") {
    return renderSrc; // already named
  }

  let paramsEnd;
  if (renderSrc[rs] === "(") {
    paramsEnd = matchBalanced(renderSrc, rs, "(", ")");
  } else if (/[A-Za-z_$]/.test(renderSrc[rs])) {
    const m = renderSrc.slice(rs).match(/^[A-Za-z_$][\w$]*/);
    if (!m) return renderSrc;
    paramsEnd = rs + m[0].length - 1;
  } else {
    return renderSrc;
  }

  const params = renderSrc.slice(rs, paramsEnd + 1);
  const afterParams = skipWs(renderSrc, paramsEnd + 1);
  if (renderSrc.slice(afterParams, afterParams + 2) !== "=>") return renderSrc;

  const bodyStart = skipWs(renderSrc, afterParams + 2);
  if (renderSrc[bodyStart] === "{") {
    const bodyEnd = matchBalanced(renderSrc, bodyStart, "{", "}");
    const body = renderSrc.slice(bodyStart, bodyEnd + 1);
    const trailing = renderSrc.slice(bodyEnd + 1); // rarely anything
    return `function ${name}${params} ${body}${trailing}`;
  }

  // Expression body: (...), <jsx/>, or other expr
  let bodyEnd;
  if (renderSrc[bodyStart] === "(") {
    bodyEnd = matchBalanced(renderSrc, bodyStart, "(", ")") + 1;
  } else {
    bodyEnd = scanJsxOrExpr(renderSrc, bodyStart);
  }
  const body = renderSrc.slice(bodyStart, bodyEnd).trimEnd();
  const trailing = renderSrc.slice(bodyEnd);
  return `function ${name}${params} {\n    return ${body};\n  }${trailing}`;
}

/** Transform one source file's contents. Exported for unit-style smoke checks. */
export function transformSourceForTreeshake(code: string): string {
  // 1. Strip bare top-level displayName assignments (source on disk keeps
  //    them). Guarded by maskNonCode: text that merely *looks like*
  //    `Foo.displayName = "...";` inside a comment or a template literal is
  //    left completely untouched. Quoted strings stay unmasked here (see
  //    maskNonCode) because the match is *meant* to consume the assignment's
  //    own quoted value.
  let next = maskGuardedReplace(
    code,
    /^[ \t]*[A-Za-z_$][\w$]*\.displayName\s*=\s*["'`][^"'`]*["'`]\s*;?[ \t]*\r?\n?/gm,
    () => "",
    { maskQuotedStrings: false }
  );

  // 2. Prefix pure callees that otherwise poison tree-shaking. Avoid
  //    double-prefix. Guarded by maskNonCode for the same reason: this must
  //    never insert `/* @__PURE__ */` — which itself contains `*/` — at a
  //    position that is lexically inside an existing comment, or the
  //    inserted `*/` would close that comment early and turn the rest of it
  //    into live code in the built bundle.
  next = maskGuardedReplace(
    next,
    /(?<!\/\* @__PURE__ \*\/\s*)\b(React\.(?:forwardRef|memo)|cva)\s*(?=[<(])/g,
    (m) => `/* @__PURE__ */ ${m[1]}`
  );

  // 3. Name the render function inside each React.forwardRef so DevTools
  // still resolves a real name after displayName is stripped from dist.
  // The declaration itself is located via the same mask (so a comment or
  // string that merely looks like a forwardRef declaration can't be picked
  // up); matchBalanced/arrowToNamed below already track comments/strings
  // correctly on their own once given a real starting position.
  let out = "";
  let last = 0;
  let match;
  const re =
    /((?:export\s+)?const\s+)([A-Za-z_$][\w$]*)(\s*=\s*(?:\/\* @__PURE__ \*\/\s*)?React\.forwardRef)\b/g;
  const mask = maskNonCode(next);
  while ((match = re.exec(mask)) !== null) {
    const name = match[2];
    const headEnd = match.index + match[0].length; // after forwardRef
    let j = skipWs(next, headEnd);
    const typeStart = j;
    j = matchTypeArgs(next, j);
    const typeArgs = next.slice(typeStart, j);
    j = skipWs(next, j);
    if (next[j] !== "(") continue;
    const close = matchBalanced(next, j, "(", ")");
    const inner = next.slice(j + 1, close);
    const named = arrowToNamed(name, inner);

    out += next.slice(last, match.index);
    out += match[1] + name + match[3] + typeArgs + "(" + named + ")";
    last = close + 1;
    re.lastIndex = last;
  }
  out += next.slice(last);
  return out;
}

function loaderFor(filePath: string): Loader {
  const ext = path.extname(filePath);
  switch (ext) {
    case ".tsx":
      return "tsx";
    case ".ts":
      return "ts";
    case ".jsx":
      return "jsx";
    case ".js":
      return "js";
    case ".mts":
      return "ts";
    case ".cts":
      return "ts";
    default:
      return "tsx";
  }
}

export function forsightTreeshakePlugin(): Plugin {
  return {
    name: "forsight-treeshake",
    setup(build) {
      build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, async (args) => {
        // Only rewrite our library sources. Absolute path check keeps
        // node_modules and generated files on the default loader path.
        const normalized = args.path.split(path.sep).join("/");
        if (normalized.includes("/node_modules/")) return null;
        if (!normalized.includes("/src/")) return null;

        const source = await fs.promises.readFile(args.path, "utf8");
        // Cheap bail-out when the file has nothing we rewrite.
        if (
          !source.includes("forwardRef") &&
          !source.includes("displayName") &&
          !/\bcva\s*[<(]/.test(source) &&
          !source.includes("React.memo")
        ) {
          return null;
        }

        const contents = transformSourceForTreeshake(source);
        return { contents, loader: loaderFor(args.path) };
      });
    },
  };
}
