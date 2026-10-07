#!/usr/bin/env bash
# Rebuild soroban-lint-wasm from the core repository and re-vendor it here.
#
# The portal commits the WebAssembly artifacts so that the deployed site and its
# tests are reproducible without a Rust toolchain. Run this after changing the
# core rules and commit the result.
#
# Usage: scripts/sync-wasm.sh [path-to-soroban-lint-core]
set -euo pipefail

CORE="${1:-../soroban-lint-core}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -f "${CORE}/Cargo.toml" ]; then
  echo "error: ${CORE} does not look like the soroban-lint-core repository" >&2
  exit 1
fi

command -v wasm-pack >/dev/null || { echo "error: wasm-pack is not on PATH" >&2; exit 1; }
command -v wasm-opt >/dev/null || { echo "error: wasm-opt is not on PATH" >&2; exit 1; }

PKG="${CORE}/soroban-lint-wasm/pkg"

echo "==> building ${CORE}/soroban-lint-wasm"
rm -rf "${PKG}"
(cd "${CORE}" && wasm-pack build soroban-lint-wasm --target web --release --out-dir pkg)

RAW_BYTES="$(wc -c < "${PKG}/soroban_lint_wasm_bg.wasm")"
echo "==> wasm-opt -Oz"
wasm-opt -Oz \
  --enable-bulk-memory \
  --enable-nontrapping-float-to-int \
  -o "${PKG}/soroban_lint_wasm_bg.wasm" \
  "${PKG}/soroban_lint_wasm_bg.wasm"

OPT_BYTES="$(wc -c < "${PKG}/soroban_lint_wasm_bg.wasm")"
COMMIT="$(cd "${CORE}" && git rev-parse HEAD)"

echo "==> vendoring into the portal"
mkdir -p "${HERE}/src/wasm"
cp "${PKG}/soroban_lint_wasm.js" "${HERE}/src/wasm/"
cp "${PKG}/soroban_lint_wasm.d.ts" "${HERE}/src/wasm/"
cp "${PKG}/soroban_lint_wasm_bg.wasm.d.ts" "${HERE}/src/wasm/"

# The binary lives beside the JS, not in `public/`: `next.config.ts` emits
# `*.wasm` as a build asset, so it gets a content-hashed URL and stays out of
# the JavaScript bundle. `public/` would work too but pins a mutable path.
cp "${PKG}/soroban_lint_wasm_bg.wasm" "${HERE}/src/wasm/"

# `rm public/wasm` from an earlier layout so the committed tree has one binary.
rm -rf "${HERE}/public/wasm"

cat > "${HERE}/src/wasm/PROVENANCE.md" <<EOF
# Vendored WebAssembly build

Copied verbatim by \`scripts/sync-wasm.sh\` from \`soroban-lint-core\`.

| | |
|---|---|
| Source commit | \`${COMMIT}\` |
| Build | \`wasm-pack build soroban-lint-wasm --target web --release\` |
| Optimizer | \`wasm-opt -Oz\` (binaryen) |
| Size before \`wasm-opt\` | ${RAW_BYTES} bytes |
| Size after \`wasm-opt\` | ${OPT_BYTES} bytes |

Do not edit these files by hand. To refresh them, run \`scripts/sync-wasm.sh\` and
commit the result.
EOF

echo "==> done (${RAW_BYTES} -> ${OPT_BYTES} bytes, core ${COMMIT})"
