import type { Metadata } from "next";
import Link from "next/link";

import { RULES } from "@/generated/rule-catalog";

/**
 * The rule index.
 *
 * Everything here comes from `src/generated/rule-catalog.ts`, which
 * `scripts/generate-rule-catalog.mjs` writes from `soroban-lint rules --format json`
 * on every build. If a rule's severity or stability changes upstream, this page
 * changes with it or the build fails.
 */

export const metadata: Metadata = {
  title: "Rules — soroban-lint",
  description:
    "Every rule soroban-lint registers, with its rationale, its limitations, and its stability.",
};

const STABILITY_CLASS = {
  stable: "bg-ok-bg text-ok ring-ok/30",
  experimental: "bg-warn-bg text-warn ring-warn/30",
} as const;

export default function RulesPage() {
  const stable = RULES.filter((rule) => rule.stability === "stable").length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Rules</h1>
        <p className="max-w-3xl text-ink-muted">
          {RULES.length} registered rules: {stable} stable and {RULES.length - stable}{" "}
          experimental. Experimental rules run only with <code className="font-mono">--experimental</code>.
          Rule IDs are permanent — a retired ID is never reused or renumbered.
        </p>
        <p className="text-sm text-ink-subtle">
          Generated at build time from <code className="font-mono">soroban-lint rules --format json</code>
          , so this page cannot describe a rule the binary does not have.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {RULES.map((rule) => (
          <li key={rule.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/rules/${rule.id}`} className="font-mono text-sm font-semibold text-ink hover:underline">
                {rule.id}
              </Link>
              <span className="font-mono text-xs text-ink-subtle">{rule.name}</span>
              <span
                className={`ml-auto rounded px-2 py-0.5 text-xs ring-1 ring-inset ${STABILITY_CLASS[rule.stability]}`}
              >
                {rule.stability}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink">{rule.description}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 text-xs text-ink-muted">
              <dt className="font-medium">Default severity</dt>
              <dd>{rule.default_severity}</dd>
              <dt className="font-medium">Default confidence</dt>
              <dd>{rule.default_confidence}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}