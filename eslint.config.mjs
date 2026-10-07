import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The generated wasm-pack glue and typings, copied verbatim from
    // soroban-lint-core by scripts/sync-wasm.sh. Linting vendored output is
    // noise; the .js carries its own directives, so an ignore here also avoids
    // "unused eslint-disable" warnings on the .d.ts files.
    "src/wasm/soroban_lint_wasm.js",
    "src/wasm/soroban_lint_wasm.d.ts",
    "src/wasm/soroban_lint_wasm_bg.wasm.d.ts",
    // Third-party Rust (and one bundled JS file) fetched for the parity corpus by
    // scripts/sync-corpus.sh. It is test input, not project code.
    "tests/corpus/**",
    // Static assets: the self-hosted Monaco build copied in at build time.
    "public/**",
    // Written by Playwright.
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
