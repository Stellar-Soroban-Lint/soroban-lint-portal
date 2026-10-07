/**
 * The rule catalog's shape, matching `soroban-lint rules --format json`.
 *
 * The portal never hardcodes rule metadata. `scripts/generate-rule-catalog.mjs`
 * runs the CLI on every build and writes `src/generated/rule-catalog.ts`, so the
 * /rules pages cannot describe a rule the binary does not have.
 */

import type { Confidence, Severity } from "./diagnostics";

export type Stability = "stable" | "experimental";

export interface RuleMeta {
  id: string;
  name: string;
  description: string;
  rationale: string;
  limitations: string;
  default_severity: Severity;
  default_confidence: Confidence;
  stability: Stability;
}

export interface RuleCatalog {
  /** Schema version of the CLI's JSON document, not the linter version. */
  version: number;
  rules: RuleMeta[];
}

/** Parse the rule catalog the WASM build returns at runtime. */
export function parseRuleCatalog(json: string): RuleCatalog {
  const parsed: unknown = JSON.parse(json);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as RuleCatalog).rules)
  ) {
    throw new Error("soroban-lint returned an unexpected rule catalog");
  }
  return parsed as RuleCatalog;
}