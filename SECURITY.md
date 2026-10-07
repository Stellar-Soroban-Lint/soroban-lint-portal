# Security policy

## This tool aids review; it is not an audit

> soroban-lint performs syntactic, per-file analysis of Soroban contract source using the Rust AST. It flags patterns associated with missing authorization checks, panic paths, unchecked arithmetic, and storage hazards in `#[contractimpl]` functions. It does not expand macros, resolve types, or follow calls across files, so it can miss real issues (false negatives) and flag safe code (false positives). A clean report is not evidence a contract is secure, and this tool is not a substitute for an audit.

No output of the playground is a security guarantee. Treat every finding as a prompt
for human review, and a clean editor as "no findings from this set of syntactic
checks", not "no vulnerabilities".

## Your contract never leaves the browser

The linter runs as WebAssembly shipped to the page. Source you paste stays in memory:
there is no backend, the share link is a URL fragment (`location.hash`, which browsers
do not send in requests), and the page makes no third-party request — Monaco is
self-hosted. If you find a path that sends source off-origin, that is a security bug.

## Reporting a bug in the portal

Open an issue with the browser and version, the contract, and what the editor showed
versus what `soroban-lint check --format json` reports on the same file (the parity
test should have caught a divergence):

https://github.com/Stellar-Soroban-Lint/soroban-lint-portal/issues

## A vulnerability in the portal itself

If you find a way to make the portal execute attacker-controlled code, leak the
pasted source, or render fabricated findings, report it privately with a GitHub
security advisory on this repository rather than a public issue.

## Reporting a vulnerability you find in a third-party contract

The maintainers do **not** audit contracts and cannot triage third-party
vulnerabilities. Use the contract vendor's responsible-disclosure channel, the
Stellar/Soroban security resources (`https://developers.stellar.org/docs/tools/developer-tools/security-tools`),
or the Soroban Security Portal (`https://stellarsecurityportal.com`). Do not open a
public issue here containing a live exploit against a deployed contract.
