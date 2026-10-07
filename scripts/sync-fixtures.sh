#!/usr/bin/env bash
# Copy the curated rule fixtures from soroban-lint-core into the parity corpus.
#
# The fixtures are the known-answer half of the parity gate: each one carries a
# rule the core test suite asserts. Vendoring them keeps `npm test` runnable
# without a Rust toolchain or network, and means the portal cannot drift onto a
# different fixture set than the one its rules were proven against.
#
# Usage: scripts/sync-fixtures.sh [path-to-soroban-lint-core]
set -euo pipefail

CORE="${1:-../soroban-lint-core}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${CORE}/soroban-lint-core/tests/fixtures"
DEST="${HERE}/tests/corpus/fixtures"

if [ ! -d "${SRC}/vulnerable" ] || [ ! -d "${SRC}/safe" ]; then
  echo "error: ${SRC} does not look like the core fixtures directory" >&2
  exit 1
fi

mkdir -p "${DEST}"
rm -f "${DEST}"/*.rs

# Prefix each fixture with its polarity so the vendored names are unambiguous:
# `vulnerable/sl001_missing_auth.rs` becomes `vulnerable_sl001_missing_auth.rs`.
count=0
for kind in vulnerable safe; do
  for file in "${SRC}/${kind}"/*.rs; do
    name="$(basename "${file}")"
    cp "${file}" "${DEST}/${kind}_${name}"
    count=$((count + 1))
  done
done

echo "==> copied ${count} fixtures into ${DEST#"${HERE}"/}"