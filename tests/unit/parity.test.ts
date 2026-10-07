import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { parseDiagnostics, type Diagnostic } from "@/lib/diagnostics";
import init, { lintSource, rulesJson, version } from "@/wasm/soroban_lint_wasm.js";

import { FIXTURES, type CorpusFile } from "../helpers/corpus";
import { EXPECTED_VERSION, requireNativeCliPath } from "../helpers/native-cli";

/**
 * The parity gate: the browser build and the native CLI must report the same
 * diagnostics for the same input.
 *
 * This is the "zero mock data" proof for the portal. The playground's only
 * source of findings is the WASM module in `src/wasm/`, so if the two engines
 * ever disagreed the site would be showing a user findings the CLI would not, and
 * every screenshot of it would be fiction.
 *
 * The comparison covers the whole `Diagnostic` object, not just rule IDs: a
 * message, severity, confidence, or span difference is a real divergence
 * between what CI reports and what the playground shows.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WASM_PATH = join(ROOT, "src", "wasm", "soroban_lint_wasm_bg.wasm");

/** Every `.rs` file under the benchmark corpus, as a corpus entry. */
function corpusFiles(): CorpusFile[] {
  const base = join(ROOT, "tests", "corpus", "soroban-examples");
  const found: CorpusFile[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir).sort()) {
      if (entry === ".git" || entry === "target") {
        continue;
      }
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (entry.endsWith(".rs")) {
        found.push({
          path: relative(ROOT, path),
          lintPath: relative(ROOT, path),
          kind: "corpus",
          expectedRules: [],
          expectClean: false,
        });
      }
    }
  };

  walk(base);
  return found.sort((a, b) => a.path.localeCompare(b.path));
}

const CORPUS: readonly CorpusFile[] = [...FIXTURES, ...corpusFiles()];

/** Read a corpus file's source, so both engines see byte-identical input. */
function sourceFor(file: CorpusFile): string {
  return readFileSync(join(ROOT, file.path), "utf8");
}

/** Run the native CLI; returns stdout. Exit code 1 means "findings", not failure. */
function runCli(binary: string, args: readonly string[]): string {
  const result = spawnSync(binary, args, { cwd: ROOT, encoding: "utf8" });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `soroban-lint ${args.join(" ")} exited ${String(result.status)}\n${result.stderr}`,
    );
  }
  return result.stdout;
}

function cliDiagnostics(binary: string, file: CorpusFile, experimental: boolean): Diagnostic[] {
  const args = ["check", file.path, "--format", "json"];
  if (experimental) {
    args.push("--experimental");
  }
  return parseDiagnostics(runCli(binary, args)).diagnostics;
}

function wasmDiagnostics(file: CorpusFile, experimental: boolean): Diagnostic[] {
  return parseDiagnostics(lintSource(file.lintPath, sourceFor(file), experimental)).diagnostics;
}

/**
 * A comparable rendering: sorted by position, with `file` dropped.
 *
 * `file` is dropped because the CLI is given a repository-relative path while
 * the WASM call is given the lint path, so the field legitimately differs. Every
 * other field is compared.
 */
function normalize(diagnostics: readonly Diagnostic[]): unknown[] {
  return diagnostics
    .map((diagnostic) => ({ ...diagnostic, file: "" }))
    .sort((a, b) =>
      a.rule_id === b.rule_id
        ? a.start_line - b.start_line || a.start_column - b.start_column
        : a.rule_id.localeCompare(b.rule_id),
    );
}

let binary: string;

beforeAll(async () => {
  binary = requireNativeCliPath();
  await init({ module_or_path: readFileSync(WASM_PATH) });
});

describe("parity: the WASM build and the native CLI", () => {
  it("covers the whole corpus, with both populations present", () => {
    expect(FIXTURES.length).toBe(22);
    expect(CORPUS.length).toBeGreaterThan(100);
  });

  it("reports the version the CI job pinned", () => {
    if (EXPECTED_VERSION !== null) {
      expect(version()).toBe(EXPECTED_VERSION);
    }
  });

  for (const experimental of [false, true]) {
    const mode = experimental ? "with experimental rules enabled" : "with default rules only";

    it(`produces identical diagnostics for every corpus file ${mode}`, () => {
      const mismatches: string[] = [];
      let findings = 0;

      for (const file of CORPUS) {
        const native = normalize(cliDiagnostics(binary, file, experimental));
        const wasm = normalize(wasmDiagnostics(file, experimental));
        findings += native.length;

        if (JSON.stringify(native) !== JSON.stringify(wasm)) {
          mismatches.push(
            `${file.path}\n  native: ${JSON.stringify(native)}\n  wasm:   ${JSON.stringify(wasm)}`,
          );
        }
      }

      // A gate that compared nothing must not pass silently.
      expect(CORPUS.length).toBeGreaterThan(100);
      expect(mismatches, `parity mismatches:\n${mismatches.join("\n")}`).toEqual([]);
      // The fixtures exist to trip rules; if that stops happening the corpus was
      // swapped for something inert and the gate is worthless.
      expect(findings).toBeGreaterThan(0);
    });
  }

  it("still trips the rules each vulnerable fixture is meant to exercise", () => {
    for (const file of FIXTURES) {
      const diagnostics = wasmDiagnostics(file, true);
      const rules = new Set(diagnostics.map((diagnostic) => diagnostic.rule_id));
      for (const expected of file.expectedRules) {
        expect(rules, `${file.path} should exercise ${expected}`).toContain(expected);
      }
    }
  });

  it("agrees with the CLI on the rule catalog", () => {
    // The /rules pages are generated from `rules --format json`, so a divergence
    // here would mean the site documents a different rule set than the binary
    // producing the playground's findings.
    const catalog: unknown = JSON.parse(rulesJson());
    const cli: unknown = JSON.parse(runCli(binary, ["rules", "--format", "json"]));
    expect(catalog).toEqual(cli);
  });
});