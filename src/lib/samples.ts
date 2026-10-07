/**
 * A sample contract offered in the editor.
 *
 * The instances come from `src/generated/samples.ts`, which
 * `scripts/generate-samples.mjs` builds from the rule fixtures in
 * `soroban-lint-core`. Nothing here is hand-written contract code: a sample that
 * disagreed with what the linter reports would be exactly the canned-data
 * failure this project is built to avoid.
 */

import { SAMPLES } from "@/generated/samples";

export interface Sample {
  id: string;
  label: string;
  /** The fixture this sample was copied from. */
  fixture: string;
  /** One or two sentences, with the rules the linter reports, named. */
  blurb: string;
  /** Path used only to label findings, exactly as the CLI does. */
  path: string;
  /** The contract source. */
  source: string;
  /** Rule IDs `soroban-lint check` reports for this file today. */
  expectedRules: string[];
}

export { SAMPLES };

/** The sample the portal opens with. */
export const DEFAULT_SAMPLE: Sample = SAMPLES[0] as Sample;

/** Look up a sample by id, falling back to the default. */
export function sampleById(id: string): Sample {
  return SAMPLES.find((sample) => sample.id === id) ?? DEFAULT_SAMPLE;
}