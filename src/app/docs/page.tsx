import type { Metadata } from "next";
import Link from "next/link";

import ScopeStatement from "@/components/ScopeStatement";
import { RULES } from "@/generated/rule-catalog";

/**
 * CLI, action, configuration, and suppression reference.
 *
 * Server-rendered and static so it is readable without JavaScript, and written
 * against the shipped CLI's actual flags and exit codes rather than an idealised
 * interface.
 */

export const metadata: Metadata = {
  title: "Docs — soroban-lint",
  description: "CLI usage, GitHub Action, configuration, and suppression syntax for soroban-lint.",
};

const CODE = "rounded bg-canvas px-1.5 py-0.5 font-mono text-[0.85em]";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={id}>
      <h2 id={id} className="scroll-mt-24 text-xl font-semibold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Docs</h1>
        <p className="text-ink-muted">
          How to run the same analysis in a terminal, in CI, and in this browser tab. Everything
          described here is what the released <code className={CODE}>soroban-lint</code>{" "}
          {RULES.length}-rule v1 actually does.
        </p>
        <ScopeStatement />
      </header>

      <nav aria-label="On this page" className="text-sm">
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-ink-muted">
          {[
            ["cli", "CLI"],
            ["install", "Install"],
            ["action", "GitHub Action"],
            ["config", "Configuration"],
            ["suppression", "Suppression"],
            ["limitations", "Limitations"],
          ].map(([anchor, label]) => (
            <li key={anchor}>
              <a href={`#${anchor}`} className="underline decoration-line underline-offset-2 hover:text-ink">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="cli" title="CLI">
        <pre tabIndex={0} className="overflow-x-auto rounded-lg border border-line bg-surface p-4 text-sm text-ink">
          <code>{`soroban-lint check <path> [--format text|json|sarif] [--config <file>]
                          [--fail-on error|warning|info|never] [--experimental]

soroban-lint rules --format json`}</code>
        </pre>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">CLI exit codes</caption>
          <thead className="text-ink-subtle">
            <tr>
              <th scope="col" className="py-1 pr-3 font-medium">
                Exit code
              </th>
              <th scope="col" className="py-1 font-medium">
                Meaning
              </th>
            </tr>
          </thead>
          <tbody className="text-ink">
            <tr className="border-t border-line">
              <td className="py-1 pr-3 font-mono">0</td>
              <td className="py-1">No findings at or above <code className={CODE}>--fail-on</code>.</td>
            </tr>
            <tr className="border-t border-line">
              <td className="py-1 pr-3 font-mono">1</td>
              <td className="py-1">At least one finding at or above the threshold.</td>
            </tr>
            <tr className="border-t border-line">
              <td className="py-1 pr-3 font-mono">2</td>
              <td className="py-1">Usage or internal error.</td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-ink-muted">
          A file that fails to parse yields an <code className={CODE}>SL000</code> diagnostic and the
          run continues; it is not a crash and not exit 2.
        </p>
      </Section>

      <Section id="install" title="Install">
        <p className="text-ink-muted">
          The crates are not on crates.io yet, so install a published release binary. It is verified
          against the SHA-256 file published beside it.
        </p>
        <pre tabIndex={0} className="overflow-x-auto rounded-lg border border-line bg-surface p-4 text-sm text-ink">
          <code>{`curl -fsSLO https://github.com/Stellar-Soroban-Lint/soroban-lint-core/releases/download/v0.1.0/soroban-lint-v0.1.0-x86_64-unknown-linux-gnu.tar.gz
curl -fsSLO https://github.com/Stellar-Soroban-Lint/soroban-lint-core/releases/download/v0.1.0/soroban-lint-v0.1.0-x86_64-unknown-linux-gnu.tar.gz.sha256
sha256sum -c soroban-lint-v0.1.0-x86_64-unknown-linux-gnu.tar.gz.sha256
tar xzf soroban-lint-v0.1.0-x86_64-unknown-linux-gnu.tar.gz`}</code>
        </pre>
        <p className="text-sm text-ink-muted">
          Or let the action do it — it downloads, checksum-verifies, and caches the matching binary
          for the runner.
        </p>
      </Section>

      <Section id="action" title="GitHub Action">
        <pre tabIndex={0} className="overflow-x-auto rounded-lg border border-line bg-surface p-4 text-sm text-ink">
          <code>{`name: soroban-lint
on: [push, pull_request]

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: Stellar-Soroban-Lint/soroban-lint-action@v1
        with:
          path: contracts
          fail-on: error
          upload-sarif: true`}</code>
        </pre>
        <p className="text-sm text-ink-muted">
          Inputs: <code className={CODE}>version</code>, <code className={CODE}>repository</code>,{" "}
          <code className={CODE}>path</code>, <code className={CODE}>fail-on</code>,{" "}
          <code className={CODE}>experimental</code>, <code className={CODE}>config</code>,{" "}
          <code className={CODE}>args</code>, <code className={CODE}>annotations</code>,{" "}
          <code className={CODE}>max-annotations</code>, <code className={CODE}>comment</code>,{" "}
          <code className={CODE}>checksum</code>, <code className={CODE}>sarif-file</code>,{" "}
          <code className={CODE}>token</code>. The action writes inline annotations and a job summary,
          and on a pull request with a write token it posts one summary comment which it updates in
          place on later pushes. Point <code className={CODE}>sarif-file</code> at a path and upload
          it with <code className={CODE}>github/codeql-action/upload-sarif</code> to get Code
          Scanning alerts. On a fork pull request the token is read-only, so the comment and the
          SARIF upload are skipped; annotations and the job summary still work.
        </p>
      </Section>

      <Section id="config" title="Configuration">
        <p className="text-ink-muted">
          <code className={CODE}>soroban-lint.toml</code> in the invocation root, or passed with{" "}
          <code className={CODE}>--config</code>:
        </p>
        <pre tabIndex={0} className="overflow-x-auto rounded-lg border border-line bg-surface p-4 text-sm text-ink">
          <code>{`# Whether experimental rules run. Default false.
experimental = false

# Optional include/exclude globs (globset syntax).
include = ["src/**/*.rs", "contracts/**/*.rs"]
exclude = ["target/**", "tests/**"]

[rules]
# Shorthand: "off" | "error" | "warning" | "info"
SL006 = "off"

# Table form for explicit control
[rules.SL001]
enabled = true
severity = "error"`}</code>
        </pre>
      </Section>

      <Section id="suppression" title="Suppression">
        <p className="text-ink-muted">
          <code className={CODE}>syn</code> discards comments, so suppressions are read from the raw
          source lines and mapped onto the AST spans. The comment applies to the same line or the
          line immediately after it:
        </p>
        <pre tabIndex={0} className="overflow-x-auto rounded-lg border border-line bg-surface p-4 text-sm text-ink">
          <code>{`// soroban-lint-ignore: SL001, SL005
pub fn set_balance(env: Env, addr: Address, amount: i128) {
    // soroban-lint-ignore: SL002
    let current: i128 = env.storage().persistent().get(&addr).unwrap();
}`}</code>
        </pre>
        <ul className="list-disc pl-5 text-sm text-ink-muted">
          <li>Several IDs may be listed, comma separated.</li>
          <li>
            An unknown ID is reported as <code className={CODE}>SL000</code> rather than ignored, so
            a typo cannot silently disable a rule.
          </li>
          <li>A suppression applies only to the line it annotates, never to a whole function.</li>
        </ul>
      </Section>

      <Section id="limitations" title="Limitations">
        <p className="text-ink-muted">
          The linter reads syntax, not types, and it does not expand macros or follow calls across
          files. Each{" "}
          <Link href="/rules" className="underline decoration-line underline-offset-2 hover:text-ink">
            rule page
          </Link>{" "}
          states its own false-positive and false-negative modes. The dominant one: because there is
          no type resolution, most values loaded from storage carry no syntactic integer evidence,
          so <code className={CODE}>SL003</code> fires far less often than you might expect.
        </p>
        <p className="text-sm text-ink-muted">
          This tool aids review. It is not an audit, and a clean report is not evidence a contract
          is secure.
        </p>
      </Section>
    </div>
  );
}