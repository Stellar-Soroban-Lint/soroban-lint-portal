"use client";

/**
 * The typed boundary around the vendored `soroban-lint-wasm` build.
 *
 * `src/wasm/soroban_lint_wasm.js`, the `.d.ts` files, and the `.wasm` binary are
 * copied verbatim by `scripts/sync-wasm.sh` from `wasm-pack build --target web`
 * in `soroban-lint-core`; `src/wasm/PROVENANCE.md` records the source commit.
 *
 * The binary is imported as a build asset rather than read from `public/`, so it
 * is emitted once, under a content-hashed URL, and never enters the JavaScript
 * bundle as base64. Nothing is fetched until `loadLinter()` runs, which only
 * happens in the browser: the workbench is imported with `ssr: false`.
 */

import init, { lintSource, rulesJson, version } from "./soroban_lint_wasm.js";

import wasmUrl from "./soroban_lint_wasm_bg.wasm";

/** The hashed URL the bundler emitted for the WebAssembly binary. */
export const WASM_URL: string = wasmUrl;

let initialised: Promise<void> | undefined;

/**
 * Instantiate the module once per page load.
 *
 * Concurrent callers share the same promise, so a double-click cannot start two
 * instantiations.
 */
export function loadLinter(): Promise<void> {
  initialised ??= init({ module_or_path: WASM_URL }).then(() => undefined);
  return initialised;
}

/** Whether the module has been instantiated in this page. */
export function isLinterLoaded(): boolean {
  return initialised !== undefined;
}

/** Lint one source file; returns the JSON document the CLI prints. */
export function lintSourceJson(path: string, source: string, experimental: boolean): string {
  return lintSource(path, source, experimental);
}

/** The rule catalog as JSON. */
export function ruleCatalogJson(): string {
  return rulesJson();
}

/** The linter version compiled into the WASM binary. */
export function wasmVersion(): string {
  return version();
}