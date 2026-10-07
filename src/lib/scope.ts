/**
 * The scope statement, verbatim from `SPEC.md` §1.
 *
 * It is one uninterrupted string on purpose: every surface (READMEs, docs, the
 * action metadata, this portal) must carry the same words, and keeping it as a
 * literal makes a mechanical word-for-word check possible.
 */
export const SCOPE_STATEMENT =
  "soroban-lint performs syntactic, per-file analysis of Soroban contract source using the Rust AST. It flags patterns associated with missing authorization checks, panic paths, unchecked arithmetic, and storage hazards in `#[contractimpl]` functions. It does not expand macros, resolve types, or follow calls across files, so it can miss real issues (false negatives) and flag safe code (false positives). A clean report is not evidence a contract is secure, and this tool is not a substitute for an audit.";

/** The statement with Markdown backticks removed, for text comparisons. */
export const SCOPE_STATEMENT_PLAIN = SCOPE_STATEMENT.replaceAll("`", "");
