export const PINNED_SOROBAN_LINT_VERSION: string;
export function resolveSorobanLintBin(options?: {
  root?: string;
  env?: Record<string, string | undefined>;
}): Promise<{ path: string; source: string }>;
export function verifyReleaseChecksum(archive: Uint8Array, checksumText: string, asset?: string): string;
export function targetTriple(platform?: string, arch?: string): string;
