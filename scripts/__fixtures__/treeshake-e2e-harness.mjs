#!/usr/bin/env node
/**
 * Builds a deliberately adversarial fixture through the *real*
 * forsightTreeshakePlugin + esbuild toolchain, executes the resulting
 * bundle in an isolated VM context, and prints a JSON result on stdout.
 *
 * This runs as a plain Node child process on purpose, spawned via
 * execFileSync from forsight-treeshake-plugin.test.ts: esbuild's JS API
 * fails an internal invariant check when imported inside this project's
 * default vitest environment (jsdom — its TextEncoder isn't a real
 * Uint8Array-producing one), so the "does the built bundle actually
 * execute the payload" proof the comment/string-injection regression test
 * needs has to happen outside that process entirely.
 */
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

const here = dirname(fileURLToPath(import.meta.url));
const pluginTs = join(here, "..", "forsight-treeshake-plugin.ts");

const ADVERSARIAL_COMMENT = [
  "/**",
  " * React.forwardRef(0);(function(){ globalThis.__forsight_pwned__ = true; })();/*",
  " */",
].join("\n");

async function loadPlugin(scratchDir) {
  // scripts/forsight-treeshake-plugin.ts can't be `import`-ed directly by
  // plain Node (no TS loader here) — transpile it with esbuild first, the
  // same way tsup does when it loads this file as a config dependency.
  const built = await esbuild.build({
    entryPoints: [pluginTs],
    bundle: false,
    platform: "node",
    format: "esm",
    write: false,
  });
  const outFile = join(scratchDir, "forsight-treeshake-plugin.mjs");
  writeFileSync(outFile, built.outputFiles[0].text);
  return import(pathToFileURL(outFile).href);
}

async function main() {
  const scratchDir = mkdtempSync(join(tmpdir(), "forsight-treeshake-e2e-"));
  try {
    const { forsightTreeshakePlugin } = await loadPlugin(scratchDir);

    const srcDir = join(scratchDir, "src");
    mkdirSync(srcDir);
    const fixtureFile = join(srcDir, "widget.ts");
    const source = [
      "const React = { forwardRef: (render) => render };",
      "",
      ADVERSARIAL_COMMENT,
      "const Widget = React.forwardRef(function Widget(props) {",
      "  return props.label;",
      "});",
      "",
      "globalThis.__forsight_widget_loaded__ = true;",
      "",
    ].join("\n");
    writeFileSync(fixtureFile, source);

    const result = await esbuild.build({
      entryPoints: [fixtureFile],
      bundle: true,
      write: false,
      format: "iife",
      platform: "node",
      plugins: [forsightTreeshakePlugin()],
      logLevel: "silent",
    });
    const built = result.outputFiles[0].text;

    const sandbox = {};
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(built, sandbox, { timeout: 2000 });

    process.stdout.write(
      JSON.stringify({
        built,
        pwned: sandbox.__forsight_pwned__ ?? null,
        widgetLoaded: sandbox.__forsight_widget_loaded__ ?? null,
      })
    );
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  process.stderr.write(String((err && err.stack) || err));
  process.exit(1);
});
