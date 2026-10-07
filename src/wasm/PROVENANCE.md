# Vendored WebAssembly build

The files in this directory — `soroban_lint_wasm.js`, the `.d.ts` typings, and
`soroban_lint_wasm_bg.wasm` — are the unmodified output of `wasm-pack` from
[`soroban-lint-core`](https://github.com/Stellar-Soroban-Lint/soroban-lint-core).
`scripts/sync-wasm.sh` copies them here and regenerates this file; do not edit
them by hand.

| | |
|---|---|
| Source repository | `Stellar-Soroban-Lint/soroban-lint-core` |
| Source commit | `4afbaf041cd87a78094d69116e9af875c2bc8e3d` |
| Build | `wasm-pack build soroban-lint-wasm --target web --release` |
| Optimizer | `wasm-opt -Oz` (binaryen) |
| Vendored `.wasm` size | 711,253 bytes |
| Vendored `.wasm` SHA-256 | `e7140556c7ef33896add8971698fb1eb0de576b58c6faba98dcbe97861bd22b7` |

The vendored binary is byte-for-byte identical to the `pkg/soroban_lint_wasm_bg.wasm`
produced in `soroban-lint-core` at the commit above; `docs/ARCHITECTURE.md` in that
repository records the full size progression (1,208,552 bytes from `wasm-pack`,
711,253 bytes after `wasm-opt -Oz`).

To refresh after a rule change:

```bash
scripts/sync-wasm.sh ../soroban-lint-core
```

That needs `wasm-pack` and `wasm-opt` on `PATH`. The parity gate
(`tests/unit/parity.test.ts`) fails if this binary and the native CLI disagree on
any file in the corpus, so a stale copy cannot pass CI quietly.
