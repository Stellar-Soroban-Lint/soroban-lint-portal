#!/usr/bin/env node
/**
 * Self-host Monaco into `public/monaco/`.
 *
 * `@monaco-editor/react` loads the editor through `@monaco-editor/loader`, which
 * by default pulls `vs/` from a public CDN. For a tool that lints someone's
 * contract that is wrong twice over: the page makes a third-party request, and it
 * cannot run under a strict `script-src 'self'` policy. Copying the vendored
 * distribution into `public/` and pointing the loader at `/monaco/vs` keeps every
 * byte same-origin.
 *
 * Run from `predev` and `prebuild`; `public/monaco/` is generated and gitignored.
 *
 * Usage: node scripts/sync-monaco.mjs
 */

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "node_modules", "monaco-editor", "min", "vs");
const DEST = join(ROOT, "public", "monaco", "vs");

if (!existsSync(join(SOURCE, "loader.js"))) {
  console.error(
    `cannot self-host Monaco: ${SOURCE} is missing. Run \`npm ci\` first — ` +
      "monaco-editor is a transitive dependency of @monaco-editor/react.",
  );
  process.exit(1);
}

rmSync(DEST, { recursive: true, force: true });
mkdirSync(dirname(DEST), { recursive: true });
cpSync(SOURCE, DEST, { recursive: true });

// Read the version back from the package so the log cannot drift from the copy.
const version = JSON.parse(
  readFileSync(join(ROOT, "node_modules", "monaco-editor", "package.json"), "utf8"),
).version;

console.log(`monaco: self-hosted monaco-editor ${version} at public/monaco/vs`);
