import { describe, expect, it } from "vitest";

import { DEFAULT_SAMPLE, SAMPLES, sampleById } from "@/lib/samples";

/** The sample set, pinned so a fixture that drops out of the generator is caught. */
const EXPECTED_IDS = [
  "missing-auth",
  "panic-hazard",
  "unchecked-arith",
  "unbounded-growth",
  "protected-init",
  "auth-in-helper",
  "admin-from-storage",
  "clean",
];

describe("samples", () => {
  it("offers one starting point per rule class plus the tricky negatives", () => {
    expect(SAMPLES.map((s) => s.id)).toEqual(EXPECTED_IDS);
    expect(SAMPLES.length).toBeGreaterThanOrEqual(4);
    expect(new Set(SAMPLES.map((s) => s.source)).size).toBe(SAMPLES.length);
  });

  it("every sample is labelled, explained, and syntactically complete", () => {
    for (const sample of SAMPLES) {
      expect(sample.label.length).toBeGreaterThan(0);
      expect(sample.blurb.length).toBeGreaterThan(0);
      expect(sample.fixture).toMatch(/\.rs$/);
      expect(sample.path).toMatch(/\.rs$/);
      expect(sample.source).toContain("#![no_std]");
      expect(sample.source).toContain("#[contractimpl]");
      // Balanced braces are a cheap proxy for "parses".
      expect((sample.source.match(/{/g) ?? []).length).toBe(
        (sample.source.match(/}/g) ?? []).length,
      );
    }
  });

  it("records the rules the linter reports, so a blurb cannot overclaim", () => {
    for (const sample of SAMPLES) {
      expect(Array.isArray(sample.expectedRules)).toBe(true);
      for (const rule of sample.expectedRules) {
        expect(rule).toMatch(/^SL\d{3}$/);
      }
      if (sample.id === "clean") {
        expect(sample.expectedRules).toEqual([]);
      } else if (sample.fixture.startsWith("vulnerable")) {
        expect(sample.expectedRules.length).toBeGreaterThan(0);
      }
    }
  });

  it("opens on the first sample and falls back for unknown ids", () => {
    expect(DEFAULT_SAMPLE).toBe(SAMPLES[0]);
    expect(sampleById("clean").id).toBe("clean");
    expect(sampleById("does-not-exist")).toBe(DEFAULT_SAMPLE);
  });
});
