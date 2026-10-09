import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { PINNED_SOROBAN_LINT_VERSION } from "../../scripts/lib/soroban-lint-bin.mjs";
import { parseDiagnostics } from "@/lib/diagnostics";
import { parseRuleCatalog } from "@/lib/rules";
import { SAMPLES, sampleById } from "@/lib/samples";
import init, { lintSource, rulesJson, version } from "@/wasm/soroban_lint_wasm.js";

/**
 * These tests execute the exact `.wasm` file the bundler serves to the browser
 * (`src/wasm/`), not a rebuild, so a stale or wrong binary fails here.
 */
const WASM_PATH = fileURLToPath(
  new URL("../../src/wasm/soroban_lint_wasm_bg.wasm", import.meta.url),
);

beforeAll(async () => {
  await init({ module_or_path: readFileSync(WASM_PATH) });
});

function rulesFor(path: string, source: string, experimental: boolean): string[] {
  const document = parseDiagnostics(lintSource(path, source, experimental));
  return document.diagnostics.map((d) => d.rule_id).sort();
}

describe("the vendored WASM build", () => {
  it("keeps the version pin, provenance, and binary digest aligned", () => {
    const provenance = readFileSync(
      fileURLToPath(new URL("../../src/wasm/PROVENANCE.md", import.meta.url)),
      "utf8",
    );
    const pinnedTag = `v${PINNED_SOROBAN_LINT_VERSION.replace(/^v/, "")}`;
    const provenanceTag = provenance.match(/^\| Compatibility pin \| \[`([^`]+)`/m)?.[1];
    const provenanceHash = provenance.match(/^\| Vendored `\.wasm` SHA-256 \| `([a-f\d]{64})`/m)?.[1];
    const actualHash = createHash("sha256").update(readFileSync(WASM_PATH)).digest("hex");

    expect(provenanceTag).toBe(pinnedTag);
    expect(version()).toBe(PINNED_SOROBAN_LINT_VERSION.replace(/^v/, ""));
    expect(provenanceHash).toBe(actualHash);
  });

  it("reports its version", () => {
    expect(version()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("exposes the whole v1 rule set", () => {
    const catalog = parseRuleCatalog(rulesJson());
    expect(catalog.rules.map((r) => r.id)).toEqual([
      "SL001",
      "SL002",
      "SL003",
      "SL004",
      "SL005",
      "SL006",
      "SL007",
      "SL008",
    ]);
    expect(catalog.rules.filter((r) => r.stability === "stable").map((r) => r.id)).toEqual([
      "SL001",
      "SL002",
      "SL008",
    ]);
  });
});

describe("the sample contracts, as the portal runs them", () => {
  it("reports exactly the rules the generated samples promise", () => {
    for (const sample of SAMPLES) {
      expect(rulesFor(sample.path, sample.source, true), `${sample.id} (${sample.fixture})`).toEqual(
        [...sample.expectedRules].sort(),
      );
    }
  });

  it("keeps the default-mode findings a subset of the experimental set", () => {
    for (const sample of SAMPLES) {
      const allowed = new Set(sample.expectedRules);
      for (const rule of rulesFor(sample.path, sample.source, false)) {
        expect(allowed, `${sample.id} reports ${rule} without --experimental`).toContain(rule);
      }
    }
  });

  it("reports the clean sample clean under every rule", () => {
    expect(rulesFor(sampleById("clean").path, sampleById("clean").source, true)).toEqual([]);
  });

  it("turns a parse failure into an SL000 finding rather than a crash", () => {
    expect(rulesFor("bad.rs", "fn (", true)).toEqual(["SL000"]);
  });
});
