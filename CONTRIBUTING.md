# Contributing

Thanks for helping. The portal's job is to show exactly what the linter reports, so
the bar is "no fiction", not "looks good".

Keep this statement of scope in mind in every change, issue, and review:

> soroban-lint performs syntactic, per-file analysis of Soroban contract source using the Rust AST. It flags patterns associated with missing authorization checks, panic paths, unchecked arithmetic, and storage hazards in `#[contractimpl]` functions. It does not expand macros, resolve types, or follow calls across files, so it can miss real issues (false negatives) and flag safe code (false positives). A clean report is not evidence a contract is secure, and this tool is not a substitute for an audit.

## Ground rules

- **No canned results.** The playground runs the real WebAssembly build; there is no
  server component and no hard-coded findings. The parity test asserts the browser
  build and the native CLI agree on every corpus file.
- **Generated, not hand-written.** The rule catalog and the sample contracts come from
  the released CLI and the core fixtures. Edit the generators, not their output.
- **Self-hosted assets.** Monaco is served from `public/monaco/vs`; do not reintroduce
  a CDN dependency.
- **Keep the accessibility pass green.** `npm run e2e` runs axe over the portal's own
  markup.
- **Do not weaken a test to make it pass.** Fix the cause.

## Setup

```bash
git clone https://github.com/Stellar-Soroban-Lint/soroban-lint-portal
cd soroban-lint-portal
npm ci
```

Generation needs a `soroban-lint` binary: set `SOROBAN_LINT_BIN`, or build one in
`../soroban-lint-core` (`cargo build --release -p soroban-lint-cli`).

```bash
npm run verify   # generate + typecheck + lint + unit/parity tests + build
npx playwright install chromium
npm run e2e      # drives the production build in Chromium, including axe
```

## Refreshing the vendored WebAssembly

```bash
scripts/sync-wasm.sh ../soroban-lint-core   # needs wasm-pack and wasm-opt
```

Commit the result with the rule change that caused it.

## Commits

Conventional commits: `feat: …`, `fix: …`, `test: …`, `docs: …`. One logical change
per commit; commit regenerated `src/generated/*` with the change that produced them.

## Branch protection

`main` is protected (pull request + one review + required status checks). Don't push
directly unless you are the bypass actor.

## License

By contributing you agree your contribution is licensed under the repository's
`MIT OR Apache-2.0` terms.
