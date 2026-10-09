#!/usr/bin/env node
/**
 * Generate the playground's sample contracts from the real rule fixtures.
 *
 * The sample sources used to be hand-written snippets pasted into a TypeScript
 * file. That is exactly the "canned data" failure this project is supposed to
 * avoid: a snippet could drift from what the linter actually reports, and
 * nothing would catch it. Instead the samples are the fixtures from
 * `soroban-lint-core` that the rule test suite already asserts on, copied in by
 * `scripts/sync-fixtures.sh`.
 *
 * The blurb is generated too, by running the linter over the fixture and naming
 * the rules it trips. If a rule's behaviour changes, the sentence under the
 * button changes with it.
 *
 * Output: `src/generated/samples.ts`
 *
 * Usage: node scripts/generate-samples.mjs
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveSorobanLintBin } from "./lib/soroban-lint-bin.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = join(ROOT, "tests", "corpus", "fixtures");
const OUT_DIR = join(ROOT, "src", "generated");

/**
 * Which fixtures to offer, and why.
 *
 * One per rule keeps the catalog honest — every rule has a button — plus the
 * tricky negatives, because "no findings" is a claim worth demonstrating
 * rather than asserting.
 */
const SELECTION = [
  {
    id: "missing-auth",
    fixture: "vulnerable_sl001_missing_auth.rs",
    label: "SL001 missing auth",
    note: "A public function writes storage and never calls require_auth.",
  },
  {
    id: "panic-hazard",
    fixture: "vulnerable_sl002_panics.rs",
    label: "SL002 panic hazards",
    note: "unwrap and indexing abort the invocation instead of returning a typed error.",
  },
  {
    id: "unchecked-arith",
    fixture: "vulnerable_sl003_arith.rs",
    label: "SL003 unchecked arithmetic",
    note: "Integer literals with no overflow checks. Evidence is syntactic: most real operands are not flagged.",
  },
  {
    id: "unbounded-growth",
    fixture: "vulnerable_sl004_growth.rs",
    label: "SL004 unbounded growth",
    note: "A stored collection grows with no visible bound before it is written back.",
  },
  {
    id: "protected-init",
    fixture: "vulnerable_sl007_init.rs",
    label: "SL007 unprotected init",
    note: "An initializer with no already-initialized guard and no authorization.",
  },
  {
    id: "auth-in-helper",
    fixture: "safe_sl001_auth_in_helper.rs",
    label: "SL001 auth in a helper",
    note: "Authorization lives in a same-file helper one call away.",
  },
  {
    id: "admin-from-storage",
    fixture: "safe_sl001_admin_from_storage.rs",
    label: "SL001 admin from storage",
    note: "The admin address is loaded from storage, then require_auth is called on it.",
  },
  {
    id: "clean",
    fixture: "safe_sl002_panic_with_error.rs",
    label: "No findings",
    note: "panic_with_error! against a declared contract error, no panics to unwind.",
  },
];

const { path: binary } = await resolveSorobanLintBin();

/** Rule IDs, from the same CLI the catalog is generated from. */
function ruleIds() {
  const run = spawnSync(binary, ["rules", "--format", "json"], { encoding: "utf8" });
  if (run.status !== 0) {
    throw new Error(`soroban-lint rules failed: ${run.stderr}`);
  }
  return JSON.parse(run.stdout).rules.map((rule) => rule.id);
}

const rulesCatalog = ruleIds();

/** The rules a fixture trips with experimental rules enabled. */
function rulesFor(path) {
  const run = spawnSync(binary, ["check", path, "--format", "json", "--experimental"], {
    encoding: "utf8",
  });
  if (run.status !== 0 && run.status !== 1) {
    throw new Error(`soroban-lint check failed on ${path}: ${run.stderr}`);
  }
  return [...new Set(JSON.parse(run.stdout).diagnostics.map((d) => d.rule_id))].sort();
}

const samples = SELECTION.map((entry) => {
  const path = join(FIXTURES, entry.fixture);
  const source = readFileSync(path, "utf8");
  const rules = rulesFor(path);

  if (entry.fixture.startsWith("vulnerable") && rules.length === 0) {
    throw new Error(
      `${entry.fixture} is named vulnerable but the linter reports nothing; the sample set would be misleading`,
    );
  }

  // The blurb names the rules the linter actually reports, so it cannot claim a
  // finding the engine does not produce.
  const found =
    rules.length === 0 ? "no findings" : listOf(rules);

  return {
    id: entry.id,
    label: entry.label,
    fixture: entry.fixture,
    path: `contracts/example/src/${entry.fixture}`,
    source,
    expectedRules: rules,
    blurb: `${entry.note} The linter reports ${found}.`,
  };
});

/** "SL001 and SL002", "SL001, SL002, and SL003". */
function listOf(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  join(OUT_DIR, "samples.ts"),
  `// Generated by scripts/generate-samples.mjs. Do not edit.
//
// Sources are the rule fixtures from \`soroban-lint-core\`; \`expectedRules\` is
// what \`soroban-lint check\` reports for them today, verified at generation time.
//
// Regenerate with: npm run catalog && node scripts/generate-samples.mjs

import type { Sample } from "@/lib/samples";

export const SAMPLES: readonly Sample[] = ${JSON.stringify(samples, null, 2)} as const;
`,
);

/*
 * Per-rule examples for `/rules/[id]`: a file the rule trips, and a file it does
 * not. Both are real fixtures and both are verified by the linter at generation
 * time, so the "vulnerable vs fixed" pair on a rule page is a fact rather than
 * an illustration that has drifted.
 */
const ALL_FIXTURES = readdirSync(FIXTURES)
  .filter((name) => name.endsWith(".rs"))
  .sort();

const byRule = new Map();

for (const name of ALL_FIXTURES) {
  const rules = rulesFor(join(FIXTURES, name));
  for (const id of rules) {
    if (!byRule.has(id)) byRule.set(id, []);
    byRule.get(id).push({ fixture: name, rules });
  }
}

const examples = {};
for (const id of rulesCatalog) {
  const hits = byRule.get(id) ?? [];
  const vulnerable = hits.find((entry) => entry.fixture.startsWith("vulnerable"));
  // Prefer the safe fixture written for this same rule — `safe_sl001_*` for
  // SL001 — so the pair on the page is the rule's own before/after rather than
  // an arbitrary unrelated file.
  const slug = id.toLowerCase();
  const clean =
    ALL_FIXTURES.find(
      (name) => name.startsWith(`safe_${slug}`) && !hits.some((entry) => entry.fixture === name),
    ) ?? ALL_FIXTURES.find((name) => !hits.some((entry) => entry.fixture === name));
  examples[id] = {
    vulnerable:
      vulnerable === undefined
        ? null
        : {
            fixture: vulnerable.fixture,
            source: readFileSync(join(FIXTURES, vulnerable.fixture), "utf8"),
          },
    // The paired "fixed" example is the first fixture the rule does not trip.
    // It is not claimed to be a fix for the vulnerable one; the page says so.
    untouched:
      clean === undefined
        ? null
        : { fixture: clean, source: readFileSync(join(FIXTURES, clean), "utf8") },
  };
}

writeFileSync(
  join(OUT_DIR, "rule-examples.ts"),
  `// Generated by scripts/generate-samples.mjs. Do not edit.
//
// For each rule: a fixture the linter reports it on, and a fixture it does not.
// Both come from the \`soroban-lint-core\` fixture suite.

export interface CodeSample {
  /** The fixture file name, for provenance. */
  readonly fixture: string;
  /** The contract source, verbatim. */
  readonly source: string;
}

export interface RuleExample {
  /** A fixture the linter reports this rule on, or null if the corpus has none. */
  readonly vulnerable: CodeSample | null;
  /** A fixture this rule does not report. */
  readonly untouched: CodeSample | null;
}

export const RULE_EXAMPLES: Readonly<Record<string, RuleExample>> = ${JSON.stringify(examples, null, 2)};
`,
);

console.log(`samples: ${samples.length} generated from the rule fixtures`);
console.log(`rule examples: ${Object.keys(examples).length} rules paired with fixtures`);