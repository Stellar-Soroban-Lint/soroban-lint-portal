# Vendored WebAssembly build

The portal is pinned to core `v0.1.1` as a compatibility pin. Core `v0.1.2` is
newer, but its published WASM asset fails initialization with the same
`WebAssembly.Table.grow(): failed to grow table by 4` error as the published
`v0.1.1` asset. Both optimized release binaries export
`__wbindgen_externrefs` as table index 0, a fixed-size `funcref` table, while the
matching JavaScript glue tries to grow it. The portal cannot use either
published optimized artifact in a browser.

The vendored binary below is a fresh, unoptimized `wasm-pack` build from the
`v0.1.1` source commit. It initializes successfully, exports `lintSource`, and
matches the checksum-verified `v0.1.1` CLI across all 151 corpus files, both
with default rules and with `--experimental` enabled. The release's
`wasm-opt -Oz` step is intentionally omitted because its published output has
the table mismatch described above.

| | |
|---|---|
| Compatibility pin | [`v0.1.1`](https://github.com/Stellar-Soroban-Lint/soroban-lint-core/releases/tag/v0.1.1) |
| Source commit | `9c665ace6c1b2494ea4ab9373064b699b2a88789` |
| Published WASM archive | `soroban-lint-wasm-v0.1.1.tar.gz` |
| Published archive SHA-256 | `9b518ace14695537dc839b6071046a37bd5e2a55a65418b6fd97baeb1b2654f3` |
| Build command | `wasm-pack build soroban-lint-wasm --target web --release --out-dir pkg` |
| Build tools | `wasm-pack 0.13.1`; Rust `1.99.0` |
| Vendored `.wasm` size | 1,208,552 bytes |
| Vendored `.wasm` SHA-256 | `0fa2262183bd1ae3bbba9e1bb24b8af72ed64c880c863d11785e7a3effea4f26` |

The vendored binary intentionally differs from the published archive's
optimized `.wasm` (714,866 bytes; SHA-256
`bd2f09d0618aee3819223ee5a905b2864f0fdfaa3a9f089432b492dc8f589ecb`). The
published `v0.1.2` WASM archive checksum is
`2445546bdb3076670a2b2e6ab8f5cea49c127164fc2614a23332c6c59a7bbd0e`; its
optimized `.wasm` also fails initialization. Do not replace the compatibility
build until a published artifact passes initialization and parity.

To reproduce, check out the source commit above and run the build command in
the repository root. Then run `npm run parity` and
`npm run parity -- --experimental` in the portal repository. Both must report
151 files and zero mismatches.
