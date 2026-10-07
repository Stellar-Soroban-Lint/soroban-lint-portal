/**
 * Resolve the native `soroban-lint` CLI for the parity gate.
 *
 * The parity test compares the WASM build against a real binary, so it needs a
 * binary to run. In order of preference:
 *
 *   1. `SOROBAN_LINT_BIN` — an explicit path, used by CI to point at the
 *      checksum-verified release download.
 *   2. `../soroban-lint-core/target/{release,debug}/soroban-lint` — the local
 *      development build, so editing a rule and re-running the gate works.
 *
 * If neither exists the parity test fails loudly rather than skipping. A parity
 * gate that quietly passes because it compared nothing is worse than no gate.
 */

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Candidate paths, in preference order. */
function candidates(): string[] {
  const found: string[] = [];
  const fromEnv = process.env["SOROBAN_LINT_BIN"];
  if (fromEnv) {
    found.push(resolve(fromEnv));
  }
  const core = resolve(ROOT, "..", "soroban-lint-core", "target");
  found.push(resolve(core, "release", "soroban-lint"), resolve(core, "debug", "soroban-lint"));
  return found;
}

/** The native CLI path, or `null` when no candidate exists. */
export function nativeCliPath(): string | null {
  return candidates().find((path) => existsSync(path)) ?? null;
}

/** The native CLI path, throwing with the searched paths when absent. */
export function requireNativeCliPath(): string {
  const path = nativeCliPath();
  if (path === null) {
    throw new Error(
      [
        "no native soroban-lint binary found; the parity gate cannot run.",
        "Set SOROBAN_LINT_BIN, or build one with:",
        "  cargo build --release -p soroban-lint-cli   # in ../soroban-lint-core",
        "searched:",
        ...candidates().map((candidate) => `  ${candidate}`),
      ].join("\n"),
    );
  }
  return path;
}

/**
 * The linter version the native CLI reports.
 *
 * The release binary is resolved through the action's own download logic in CI,
 * so a parity run against a mismatched pair of versions is visible in the job
 * log rather than silently tolerated.
 */
export const EXPECTED_VERSION: string | null = process.env["SOROBAN_LINT_VERSION"] ?? null;