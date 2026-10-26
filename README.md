# soroban-lint-portal

<p>
  <a href="https://github.com/Stellar-Soroban-Lint/soroban-lint-portal/actions/workflows/ci.yml"><img src="https://github.com/Stellar-Soroban-Lint/soroban-lint-portal/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://stellar-soroban-lint.github.io/soroban-lint-portal/"><img src="https://img.shields.io/badge/playground-live-7C3AED" alt="Live playground"></a>
  <img src="https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue" alt="MIT OR Apache-2.0">
  <a href="https://discord.gg/xZRZT6TpB"><img src="https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
  <a href="https://t.me/+MrTh9uraIS5jMjhk"><img src="https://img.shields.io/badge/Telegram-join-26A5E4?logo=telegram&logoColor=white" alt="Telegram"></a>
</p>

A browser front end for [`soroban-lint`](https://github.com/Stellar-Soroban-Lint/soroban-lint-core),
the syntactic Soroban contract linter.

**Open the [live playground](https://stellar-soroban-lint.github.io/soroban-lint-portal/)** or read the [Core documentation](https://stellar-soroban-lint.github.io/soroban-lint-core/).

It runs the **real** linter client-side: `soroban-lint-core` is compiled to WebAssembly with
`wasm-pack` and vendored into `src/wasm/`. There is no server
component and no reimplementation of the rules — the portal calls the same `lintSource` the CLI and
the GitHub Action use, through the same JSON contract, and a parity test asserts the browser build
and the native CLI report identical diagnostics across the whole corpus. Source you paste into the
editor never leaves the browser.

> soroban-lint performs syntactic, per-file analysis of Soroban contract source using the Rust AST. It flags patterns associated with missing authorization checks, panic paths, unchecked arithmetic, and storage hazards in `#[contractimpl]` functions. It does not expand macros, resolve types, or follow calls across files, so it can miss real issues (false negatives) and flag safe code (false positives). A clean report is not evidence a contract is secure, and this tool is not a substitute for an audit.

[Documentation](https://stellar-soroban-lint.github.io/soroban-lint-core/) · [Core CLI](https://github.com/Stellar-Soroban-Lint/soroban-lint-core) · [GitHub Action](https://github.com/Stellar-Soroban-Lint/soroban-lint-action) · [Demo PR #1 (closed): annotations](https://github.com/Stellar-Soroban-Lint/soroban-lint-portal/pull/1) · [Demo PR #2 (merged): passing run](https://github.com/Stellar-Soroban-Lint/soroban-lint-portal/pull/2) · [Issues](https://github.com/Stellar-Soroban-Lint/soroban-lint-portal/issues)

## Stack

| | |
|---|---|
| Framework | Next.js (App Router) + React 19 |
| Styling | Tailwind CSS v4 |
| Editor | Monaco (`@monaco-editor/react`), self-hosted from `public/monaco/vs` |
| Analysis | `soroban-lint-wasm` (Rust → WebAssembly), vendored in `src/wasm/` |
| Unit tests | Vitest, including tests that execute the vendored `.wasm` and the WASM-vs-CLI parity gate |
| Browser tests | Playwright, against the production build or a deployed URL, with an axe accessibility pass |

## What it does

- Runs Soroban contract source through the shared linter in the browser and presents diagnostics alongside the editor.
- Provides a generated rule catalog and individual rule pages, including severity, stability, examples, and stated limitations.
- Supports share links by encoding the selected sample or source in the URL; pasted source is not sent to a server.
- Uses the same JSON diagnostic contract as the native CLI. The parity test compares both implementations across the corpus.

The analyzer is syntactic and per-file. It does not expand macros, resolve types, or follow calls across files. It can miss real issues and report safe code; a clean result is not evidence of security or a replacement for an audit.

## Running it

The [documentation](https://stellar-soroban-lint.github.io/soroban-lint-core/) covers the live
playground, rule catalog, architecture, and WASM-to-CLI parity guarantee.

```bash
npm ci
npm run dev          # http://localhost:3000
```

`npm run dev` and `npm run build` run two generators first:

- `npm run catalog` writes `src/generated/rule-catalog.ts` from
  `soroban-lint rules --format json`, so the `/rules` pages cannot describe a rule the binary does
  not have. It needs a `soroban-lint` executable; set `SOROBAN_LINT_BIN` or build one in
  `../soroban-lint-core` (`cargo build --release -p soroban-lint-cli`).
- `npm run monaco` copies Monaco's distribution from `node_modules` into `public/monaco/vs`, so the
  editor is served from this origin and no request leaves the page.

```bash
npm run verify       # catalog + typecheck + lint + unit tests + production build
npm run e2e          # builds, serves, and drives the portal in Chromium
```

`npm run e2e` needs a browser: `npx playwright install chromium`. To run the same suite against a
deployed site, set `E2E_BASE_URL=https://…` and no local server is started.

## How the WebAssembly is wired up

- `src/wasm/soroban_lint_wasm.js` and `src/wasm/*.d.ts` are the unmodified `wasm-pack --target web`
  glue and typings.
- `src/wasm/soroban_lint_wasm_bg.wasm` is the WebAssembly binary. `next.config.ts` emits it as a build
  asset, so it gets a content-hashed URL and stays out of the JavaScript bundle; it is instantiated
  once, in the browser only.
- `src/wasm/index.ts` is the only place that touches the generated module; the rest of the app uses
  its typed wrapper.
- `src/wasm/PROVENANCE.md` records the core commit, the build recipe, and the binary's SHA-256.

The generated rule catalog and WASM compatibility build are checked against the recorded provenance. The portal intentionally uses the documented v0.1.1 WASM compatibility build because the optimized v0.1.2 wasm-pack artifact fails to initialize in the browser with a WebAssembly table-growth error.

## What is and is not covered

The portal shows whatever the linter reports, including the rules' own stated limitations: the rule
catalog lists each rule's default severity, stability, and description, and the scope statement above
applies to every finding. The portal adds no analysis of its own.

- Samples are the linter's own fixtures from `soroban-lint-core`, copied in by
  `scripts/sync-fixtures.sh` and turned into `src/generated/samples.ts` by
  `scripts/generate-samples.mjs`; each one's blurb names the rules the linter actually reports for it.
- The Monaco editor is self-hosted (`public/monaco/vs`), so the playground runs under a strict
  `script-src 'self'` policy and makes no third-party request while linting someone's contract.
- The accessibility pass (`@axe-core/playwright`) covers the portal's own markup; Monaco's rendered
  DOM is excluded.

## Related repositories

| Project | Role or evidence |
|---|---|
| [`soroban-lint-core`](https://github.com/Stellar-Soroban-Lint/soroban-lint-core) | Rust analysis engine, CLI, docs site, and WASM source. |
| [`soroban-lint-action`](https://github.com/Stellar-Soroban-Lint/soroban-lint-action) | Runs the same linter in CI. |
| [`soroban-lint-portal`](https://github.com/Stellar-Soroban-Lint/soroban-lint-portal) | This browser playground and rule catalog. |
| [PR #1 (closed): annotations on intentionally vulnerable contracts](https://github.com/Stellar-Soroban-Lint/soroban-lint-portal/pull/1) | Findings and check annotations; kept for reference. |
| [PR #2 (merged): passing run](https://github.com/Stellar-Soroban-Lint/soroban-lint-portal/pull/2) | `fail-on: never`, five inline annotations, and passing checks. |
| [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) | Project guidance. |

## License

Licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE).

## Maintainers

| Name | GitHub | Telegram |
|---|---|---|
| ojuotimi932 | [@ojuotimi932](https://github.com/ojuotimi932) | [Telegram](https://t.me/+MrTh9uraIS5jMjhk) |

## Community

- Telegram: https://t.me/+MrTh9uraIS5jMjhk
- Discord: https://discord.gg/xZRZT6TpB

## Security

See [SECURITY.md](SECURITY.md) to report a vulnerability. The portal aids code review; it is not an audit and does not prove that a contract is secure.

## Contributors

[![Contributors](https://contrib.rocks/image?repo=Stellar-Soroban-Lint/soroban-lint-portal)](https://github.com/Stellar-Soroban-Lint/soroban-lint-portal/graphs/contributors)
