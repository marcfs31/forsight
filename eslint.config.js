import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    // .claude/worktrees holds throwaway git worktrees (full repo copies with
    // their own node_modules) created by Claude Code sessions — never lint them.
    ignores: [
      "dist",
      "storybook-static",
      "node_modules",
      ".storybook",
      ".claude/worktrees",
      // graft's generated CommonJS shims (statusline + hooks) — vendored
      // agent wiring this repo doesn't author or maintain, rewritten by
      // `graft init` / `graft upgrade`.
      ".claude/helpers",
      "fixtures/**/.next",
      // forsight is a separate Go module with its own toolchain (golangci-lint
      // for the Go source; forsight/web is its own npm project with its own
      // tsconfig, not part of this one). Its embedded dashboard build output
      // (forsight/internal/api/webdist/) is checked-in minified JS/CSS, not
      // source — linting it as if it were this project's TypeScript is what
      // broke this exclusion's absence in the first place (1600+ false
      // "'document' is not defined" errors from a single-line bundle).
      "forsight",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Plain Node scripts (the smoke test, any future release/CI scripts) —
    // not part of the browser-facing component library, so they get Node's
    // globals instead.
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        TextDecoder: "readonly",
        Buffer: "readonly",
      },
    },
  },
  // Must stay last — disables ESLint stylistic rules that would otherwise
  // fight Prettier's own formatting decisions.
  prettierConfig
);
