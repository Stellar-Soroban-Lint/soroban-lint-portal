/**
 * The parity corpus: every Rust file the gate runs through both engines.
 *
 * Two populations, deliberately different:
 *
 *   - `fixtures/` — the 22 curated files from `soroban-lint-core`
 *     (`soroban-lint-core/tests/fixtures/{vulnerable,safe}`), copied here by
 *     `scripts/sync-fixtures.sh`. These carry the known-answer expectations: the
 *     parity test asserts the WASM build reproduces the CLI *and* that the
 *     fixtures still mean what the core test suite says they mean.
 *   - `corpus/` — `stellar/soroban-examples` at the commit pinned in
 *     `docs/BENCHMARKS.md`, fetched by `scripts/sync-corpus.sh`. Real-world
 *     code where either engine can legitimately report nothing; the gate asserts
 *     only that the two agree.
 *
 * Both are committed, so `npm test` needs no network and no Rust toolchain.
 */

export type CorpusKind = "fixture" | "corpus";

export interface CorpusFile {
  /** Path relative to the repository root, e.g. `tests/corpus/fixtures/x.rs`. */
  readonly path: string;
  /** The path handed to the linter, so findings carry a realistic filename. */
  readonly lintPath: string;
  readonly kind: CorpusKind;
  /** Rule IDs the core test suite requires, checked when `kind` is `fixture`. */
  readonly expectedRules: readonly string[];
  /** True when the core suite requires this fixture to stay silent. */
  readonly expectClean: boolean;
}

/**
 * `expectClean` marks the safe fixtures. The core suite asserts each safe
 * fixture does *not* trip the rule it is named for; most of them still trip
 * others (a bounded-growth example without `require_auth` is a legitimate SL001),
 * so "safe" here never means "no findings at all".
 */
function fixture(
  name: string,
  kind: CorpusKind,
  expectedRules: readonly string[],
  expectClean = false,
): CorpusFile {
  return {
    path: `tests/corpus/fixtures/${name}`,
    lintPath: `contracts/example/src/${name}`,
    kind,
    expectedRules,
    expectClean,
  };
}

export const FIXTURES: readonly CorpusFile[] = [
  // SL001 — missing authorization
  fixture("vulnerable_sl001_missing_auth.rs", "fixture", ["SL001"]),
  fixture("vulnerable_sl001_test_helper_not_auth.rs", "fixture", ["SL001"]),
  fixture("safe_sl001_with_auth.rs", "fixture", [], true),
  fixture("safe_sl001_auth_in_helper.rs", "fixture", [], true),
  fixture("safe_sl001_auth_in_free_fn.rs", "fixture", [], true),
  fixture("safe_sl001_admin_from_storage.rs", "fixture", [], true),
  fixture("safe_sl001_private_method.rs", "fixture", [], true),
  // SL002 — panic hazards
  fixture("vulnerable_sl002_panics.rs", "fixture", ["SL002"]),
  fixture("safe_sl002_panic_with_error.rs", "fixture", [], true),
  fixture("safe_sl002_private_method.rs", "fixture", [], true),
  // SL003 — unchecked arithmetic
  fixture("vulnerable_sl003_arith.rs", "fixture", ["SL003"]),
  fixture("safe_sl003_checked.rs", "fixture", [], true),
  // SL004 — unbounded storage growth
  fixture("vulnerable_sl004_growth.rs", "fixture", ["SL004"]),
  fixture("safe_sl004_bounded.rs", "fixture", [], true),
  // SL005 — missing TTL extension
  fixture("vulnerable_sl005_ttl.rs", "fixture", ["SL005"]),
  fixture("safe_sl005_extend_ttl.rs", "fixture", [], true),
  // SL006 — questionable storage type
  fixture("vulnerable_sl006_temp.rs", "fixture", ["SL006"]),
  fixture("safe_sl006_persistent.rs", "fixture", [], true),
  // SL007 — unprotected initializer
  fixture("vulnerable_sl007_init.rs", "fixture", ["SL007"]),
  fixture("safe_sl007_guarded.rs", "fixture", [], true),
  // SL008 — unsafe / missing no_std
  fixture("vulnerable_sl008_unsafe.rs", "fixture", ["SL008"]),
  fixture("safe_sl008_clean.rs", "fixture", [], true),
];