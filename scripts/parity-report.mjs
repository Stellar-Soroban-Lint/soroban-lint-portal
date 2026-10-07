#!/usr/bin/env node
/**
 * Print the parity-gate result as a table, for pasting into a review.
 *
 * `npm run test` asserts parity; this script reports it. Same comparison, same
 * engines, same corpus — it exists so the claim "the portal and the CLI agree
 * on 151 files" can be checked rather than believed.
 *
 * Usage: node scripts/parity-report.mjs [--experimental]
 */

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WASM_PATH = join(ROOT, "src", "wasm", "soroban_lint_wasm_bg.wasm");

function nativeCli() {
  const candidates = [
    process.env.SOROBAN_LINT_BIN,
    resolve(ROOT, "..", "soroban-lint-core", "target", "release", "soroban-lint"),
    resolve(ROOT, "..", "soroban-lint-core", "target", "debug", "soroban-lint"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      statSync(candidate);
      return candidate;
    } catch {
      // try the next one
    }
  }
  throw new Error(
    "no native soroban-lint binary; set SOROBAN_LINT_BIN or run " +
      "`cargo build --release -p soroban-lint-cli` in ../soroban-lint-core",
  );
}

function collect(dir, kind, out) {
  for (const entry of readdirSync(dir).sort()) {
    if (entry === ".git" || entry === "target") continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) collect(path, kind, out);
    else if (entry.endsWith(".rs")) out.push({ path, kind, lintPath: relative(ROOT, path) });
  }
  return out;
}

const corpus = [
  ...collect(join(ROOT, "tests", "corpus", "fixtures"), "fixture", []),
  ...collect(join(ROOT, "tests", "corpus", "soroban-examples"), "corpus", []),
].sort((a, b) => a.path.localeCompare(b.path));

const experimental = process.argv.includes("--experimental");
const binary = nativeCli();

const { default: init, lintSource, version } = await import(
  join(ROOT, "src", "wasm", "soroban_lint_wasm.js")
);
await init({ module_or_path: readFileSync(WASM_PATH) });

const parse = (json) => JSON.parse(json).diagnostics ?? [];
const strip = (diagnostics) =>
  JSON.stringify(
    diagnostics
      .map((diagnostic) => ({ ...diagnostic, file: "" }))
      .sort((a, b) =>
        a.rule_id === b.rule_id
          ? a.start_line - b.start_line || a.start_column - b.start_column
          : a.rule_id.localeCompare(b.rule_id),
      ),
  );

let mismatches = 0;
let findings = 0;
const byRule = new Map();

for (const file of corpus) {
  const args = ["check", relative(ROOT, file.path), "--format", "json"];
  if (experimental) args.push("--experimental");
  const native = parse(
    spawnSync(binary, args, { cwd: ROOT, encoding: "utf8" }).stdout,
  );
  const wasm = parse(lintSource(file.lintPath, readFileSync(file.path, "utf8"), experimental));

  if (strip(native) !== strip(wasm)) {
    mismatches += 1;
    console.error(`MISMATCH ${relative(ROOT, file.path)}`);
  }
  findings += native.length;
  for (const diagnostic of native) {
    byRule.set(diagnostic.rule_id, (byRule.get(diagnostic.rule_id) ?? 0) + 1);
  }
}

const fixtures = corpus.filter((file) => file.kind === "fixture").length;
const external = corpus.length - fixtures;

console.log(`soroban-lint WASM ${version()} vs native CLI ${binary}`);
console.log(`mode: ${experimental ? "all rules (--experimental)" : "default rules only"}`);
console.log(`corpus: ${corpus.length} files (${fixtures} curated fixtures, ${external} soroban-examples)`);
console.log(`diagnostics compared: ${findings}`);
console.log(`mismatches: ${mismatches}`);
console.log(
  "findings by rule: " +
    [...byRule.entries()]
      .sort()
      .map(([rule, count]) => `${rule}=${count}`)
      .join(" "),
);
process.exit(mismatches === 0 ? 0 : 1);