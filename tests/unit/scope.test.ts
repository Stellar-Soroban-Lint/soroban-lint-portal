import { describe, expect, it } from "vitest";

import { SCOPE_STATEMENT, SCOPE_STATEMENT_PLAIN } from "@/lib/scope";

/**
 * The statement is required verbatim on every surface. Pinning its exact text
 * here means an accidental reword during a UI change fails the build.
 */
const EXPECTED =
  "soroban-lint performs syntactic, per-file analysis of Soroban contract source using the Rust AST. It flags patterns associated with missing authorization checks, panic paths, unchecked arithmetic, and storage hazards in `#[contractimpl]` functions. It does not expand macros, resolve types, or follow calls across files, so it can miss real issues (false negatives) and flag safe code (false positives). A clean report is not evidence a contract is secure, and this tool is not a substitute for an audit.";

describe("scope statement", () => {
  it("matches the normative wording exactly", () => {
    expect(SCOPE_STATEMENT).toBe(EXPECTED);
  });

  it("is a single line so it can be grepped verbatim across surfaces", () => {
    expect(SCOPE_STATEMENT).not.toContain("\n");
    expect(SCOPE_STATEMENT.split("\n")).toHaveLength(1);
  });

  it("exposes a plain-text form for rendered comparisons", () => {
    expect(SCOPE_STATEMENT_PLAIN).toBe(EXPECTED.replaceAll("`", ""));
    expect(SCOPE_STATEMENT_PLAIN).not.toContain("`");
  });
});
