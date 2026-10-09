import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  PINNED_SOROBAN_LINT_VERSION,
  resolveSorobanLintBin,
  targetTriple,
  verifyReleaseChecksum,
} from "../../scripts/lib/soroban-lint-bin.mjs";

const tempRoots: string[] = [];

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "soroban-lint-resolver-"));
  tempRoots.push(root);
  return root;
}

function fakeBinary(path: string, succeeds: boolean): string {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    succeeds
      ? '#!/bin/sh\nif [ "$1" = "--version" ]; then echo "soroban-lint resolver-test"; exit 0; fi\nif [ "$1" = "rules" ]; then echo \'{"version":"1","rules":[{"id":"SL001"}]}\'; exit 0; fi\nexit 2\n'
      : "#!/bin/sh\nexit 17\n",
  );
  chmodSync(path, 0o755);
  return path;
}

afterEach(() => {
  while (tempRoots.length > 0) rmSync(tempRoots.pop()!, { recursive: true, force: true });
});

describe("soroban-lint binary resolver", () => {
  it("rejects a failing explicit override and names its path", async () => {
    const root = tempRoot();
    const binary = fakeBinary(join(root, "bad-override"), false);
    await expect(resolveSorobanLintBin({ root, env: { SOROBAN_LINT_BIN: binary } }))
      .rejects.toThrow(`SOROBAN_LINT_BIN override is invalid (${binary})`);
  });

  it("rejects a failing adjacent binary when local use is explicitly enabled", async () => {
    const root = tempRoot();
    const binary = fakeBinary(resolve(root, "..", "soroban-lint-core", "target", "release", "soroban-lint"), false);
    await expect(resolveSorobanLintBin({ root, env: { SOROBAN_LINT_USE_LOCAL: "1" } }))
      .rejects.toThrow(`opt-in local soroban-lint build at ${binary}`);
  });

  it("uses a valid binary already in the default release cache", async () => {
    const root = tempRoot();
    const version = PINNED_SOROBAN_LINT_VERSION.startsWith("v")
      ? PINNED_SOROBAN_LINT_VERSION
      : `v${PINNED_SOROBAN_LINT_VERSION}`;
    const triple = targetTriple();
    const binary = fakeBinary(
      join(root, ".cache", "soroban-lint", version, triple, `soroban-lint-${version}-${triple}`, "soroban-lint"),
      true,
    );
    await expect(resolveSorobanLintBin({ root, env: {} })).resolves.toEqual({
      path: binary,
      source: `release ${version} (checksum-verified)`,
    });
  });

  it("aborts when a downloaded archive does not match the published checksum", () => {
    expect(() => verifyReleaseChecksum(Buffer.from("actual archive"), `${"0".repeat(64)}  archive.tar.gz`, "archive.tar.gz"))
      .toThrow("checksum mismatch for archive.tar.gz");
  });
});
