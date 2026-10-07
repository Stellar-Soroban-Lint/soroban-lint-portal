#!/usr/bin/env bash
# Fetch the benchmark corpus: stellar/soroban-examples at a pinned commit.
#
# This is the real-world half of the parity gate — code the linter never saw
# written for it. The commit is pinned so a run is reproducible: an upstream
# change can never quietly alter the parity result between CI runs.
#
# The pin matches `docs/BENCHMARKS.md` in soroban-lint-core. Update both
# together, and record the new commit in the benchmark table.
#
# Usage: scripts/sync-corpus.sh [dest-dir]
set -euo pipefail

# stellar/soroban-examples @ 03d42aa6b973dcf3a453a99d0c6a6e8d25a196e2
# Same pin as soroban-lint-core/docs/BENCHMARKS.md.
REPO="https://github.com/stellar/soroban-examples"
COMMIT="03d42aa6b973dcf3a453a99d0c6a6e8d25a196e2"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${1:-${HERE}/tests/corpus/soroban-examples}"

if [ -d "${DEST}/.git" ]; then
  echo "==> updating ${DEST#"${HERE}"/}"
  (cd "${DEST}" && git fetch -q origin "${COMMIT}")
else
  echo "==> cloning ${REPO} into ${DEST#"${HERE}"/}"
  rm -rf "${DEST}"
  git clone -q "${REPO}" "${DEST}"
fi

(cd "${DEST}" && git checkout -q --detach "${COMMIT}")

ACTUAL="$(cd "${DEST}" && git rev-parse HEAD)"
if [ "${ACTUAL}" != "${COMMIT}" ]; then
  echo "error: checked out ${ACTUAL}, expected ${COMMIT}" >&2
  exit 1
fi

# Keep the checkout usable but out of the repository's history. Only the `.rs`
# files are committed (see the .gitignore below): the parity gate reads nothing
# else, and keeping the clone would record a gitlink the gate cannot use.
rm -rf "${DEST}/.git"
cat > "${DEST}/.gitignore" <<'EOF'
# Only the `.rs` files of the pinned corpus are committed. The parity gate reads
# nothing else, and committing the cloned repository's history and binary test
# data would bloat this repository for no benefit. `scripts/sync-corpus.sh`
# re-fetches the full checkout at the pinned commit when it needs refreshing.
*
!**/
!**/*.rs
!.gitignore
EOF

COUNT="$(find "${DEST}" -name '*.rs' -not -path '*/target/*' | wc -l)"
echo "==> ${COUNT} .rs files at ${ACTUAL}"
echo "==> stripped .git; run 'git add ${DEST#"${HERE}"/}' to stage the corpus"