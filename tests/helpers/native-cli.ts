import {
  PINNED_SOROBAN_LINT_VERSION,
  resolveSorobanLintBin,
} from "../../scripts/lib/soroban-lint-bin.mjs";

/** The native CLI path resolved by the same verified resolver as generation. */
export async function requireNativeCliPath(): Promise<string> {
  return (await resolveSorobanLintBin()).path;
}

/** Keep the WASM/native parity assertion tied to the portal's single version pin. */
export const EXPECTED_VERSION = PINNED_SOROBAN_LINT_VERSION.replace(/^v/, "");
