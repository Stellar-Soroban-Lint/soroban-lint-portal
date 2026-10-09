/** Resolve the version-pinned `soroban-lint` release for portal generation/tests. */

import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_REPOSITORY = "Stellar-Soroban-Lint/soroban-lint-core";
export const PINNED_SOROBAN_LINT_VERSION = readFileSync(join(ROOT, "SOROBAN_LINT_VERSION"), "utf8").trim();

export function targetTriple(platform = process.platform, arch = process.arch) {
  const triple = {
    "linux/x64": "x86_64-unknown-linux-gnu",
    "linux/arm64": "aarch64-unknown-linux-gnu",
    "darwin/x64": "x86_64-apple-darwin",
    "darwin/arm64": "aarch64-apple-darwin",
  }[`${platform}/${arch}`];
  if (triple === undefined) {
    throw new Error(`no prebuilt soroban-lint release for ${platform}/${arch}`);
  }
  return triple;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function verifyReleaseChecksum(archive, checksumText, asset = "release archive") {
  const expected = checksumText.trim().split(/\s+/)[0];
  if (!/^[a-f\d]{64}$/i.test(expected ?? "")) {
    throw new Error(`invalid published SHA-256 for ${asset}`);
  }
  const actual = sha256(archive);
  if (actual !== expected.toLowerCase()) {
    throw new Error(`checksum mismatch for ${asset}: release says ${expected}, download hashes to ${actual}`);
  }
  return actual;
}

async function get(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "soroban-lint-portal" },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed: HTTP ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function probeBinary(binary, label) {
  const version = spawnSync(binary, ["--version"], { encoding: "utf8" });
  if (version.error || version.status !== 0 || !version.stdout.trim()) {
    throw new Error(`${label} at ${binary} failed --version: ${version.error?.message ?? version.stderr ?? `exit ${version.status}`}`);
  }

  const rules = spawnSync(binary, ["rules", "--format", "json"], { encoding: "utf8" });
  if (rules.error || rules.status !== 0) {
    throw new Error(`${label} at ${binary} failed rules --format json: ${rules.error?.message ?? rules.stderr ?? `exit ${rules.status}`}`);
  }
  let document;
  try {
    document = JSON.parse(rules.stdout);
  } catch (error) {
    throw new Error(`${label} at ${binary} returned invalid rule JSON: ${error.message}`);
  }
  if (!Array.isArray(document.rules) || document.rules.length === 0) {
    throw new Error(`${label} at ${binary} returned no rules`);
  }
}

async function releaseBinary(root, env) {
  const version = PINNED_SOROBAN_LINT_VERSION;
  const tag = version.startsWith("v") ? version : `v${version}`;
  const triple = targetTriple();
  const asset = `soroban-lint-${tag}-${triple}.tar.gz`;
  const cache = join(root, ".cache", "soroban-lint");
  const dir = join(cache, tag, triple);
  const binary = join(dir, `soroban-lint-${tag}-${triple}`, "soroban-lint");
  if (existsSync(binary)) return binary;

  const repository = env.SOROBAN_LINT_REPOSITORY ?? DEFAULT_REPOSITORY;
  const base = `https://github.com/${repository}/releases/download/${tag}`;
  const [archive, checksumText] = await Promise.all([
    get(`${base}/${asset}`),
    get(`${base}/${asset}.sha256`).then((buffer) => buffer.toString("utf8")),
  ]);
  const digest = verifyReleaseChecksum(archive, checksumText, asset);

  mkdirSync(dir, { recursive: true });
  const archivePath = join(dir, asset);
  writeFileSync(archivePath, archive);
  execFileSync("tar", ["-xzf", archivePath, "-C", dir]);
  chmodSync(binary, 0o755);
  console.log(`soroban-lint ${tag}: downloaded and verified SHA-256 ${digest}`);
  return binary;
}

function localBuild(root) {
  for (const profile of ["release", "debug"]) {
    const candidate = resolve(root, "..", "soroban-lint-core", "target", profile, "soroban-lint");
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("SOROBAN_LINT_USE_LOCAL=1, but no adjacent soroban-lint-core target/{release,debug}/soroban-lint exists");
}

/** Resolve an explicit override, an opt-in local build, or the pinned release cache. */
export async function resolveSorobanLintBin({ root = ROOT, env = process.env } = {}) {
  const override = env.SOROBAN_LINT_BIN;
  if (override !== undefined && override !== "") {
    const binary = resolve(override);
    try {
      probeBinary(binary, "SOROBAN_LINT_BIN override");
    } catch (error) {
      throw new Error(`SOROBAN_LINT_BIN override is invalid (${binary}): ${error.message}`, { cause: error });
    }
    return { path: binary, source: "SOROBAN_LINT_BIN override" };
  }

  if (env.SOROBAN_LINT_USE_LOCAL === "1") {
    const binary = localBuild(root);
    probeBinary(binary, "opt-in local soroban-lint build");
    return { path: binary, source: "opt-in local build" };
  }

  const binary = await releaseBinary(root, env);
  probeBinary(binary, "pinned release binary");
  const version = PINNED_SOROBAN_LINT_VERSION.startsWith("v")
    ? PINNED_SOROBAN_LINT_VERSION
    : `v${PINNED_SOROBAN_LINT_VERSION}`;
  return { path: binary, source: `release ${version} (checksum-verified)` };
}
