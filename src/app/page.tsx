import LintWorkbench from "@/components/LintWorkbench";
import ScopeStatement from "@/components/ScopeStatement";

const LINK = "underline decoration-line underline-offset-2 hover:text-ink";

/**
 * The playground.
 *
 * The capability claim and the limitation sit in the same paragraph on purpose:
 * the limitation is the reason the claim is narrow, and separating them is how a
 * linter ends up marketing itself as an audit.
 */
export default function Home() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">soroban-lint</h1>
        <p className="max-w-3xl text-ink-muted">
          Static analysis for Soroban smart contracts, running entirely in your browser on the same
          WebAssembly build that ships with the project. Nothing you type is uploaded — the
          playground makes no network request after loading its own binary.
        </p>
      </header>

      <ScopeStatement />

      <LintWorkbench />

      <footer className="flex flex-col gap-2 border-t border-line pt-6 text-sm text-ink-muted">
        <p>
          The editor, the checks, and the findings are all client-side, and a parity test asserts the
          browser build reports exactly what the CLI reports for every file in the
          parity corpus. The CLI and the GitHub Action share this analysis: see{" "}
          <a
            className={LINK}
            href="https://github.com/Stellar-Soroban-Lint/soroban-lint-core"
          >
            soroban-lint-core
          </a>{" "}
          and{" "}
          <a
            className={LINK}
            href="https://github.com/Stellar-Soroban-Lint/soroban-lint-action"
          >
            soroban-lint-action
          </a>
          .
        </p>
        <p className="text-xs text-ink-subtle">
          MIT OR Apache-2.0. Rule IDs are permanent; a clean report is not an audit.
        </p>
      </footer>
    </div>
  );
}