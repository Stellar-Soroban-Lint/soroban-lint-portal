import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import CodeBlock from "@/components/CodeBlock";
import { RULE_EXAMPLES } from "@/generated/rule-examples";
import { RULES } from "@/generated/rule-catalog";
import { encodeSource } from "@/lib/share";

/**
 * One rule's reference page.
 *
 * Every field comes from the generated catalog or the generated fixtures, so this
 * page cannot describe behaviour the binary does not have. The limitations are
 * given their own heading rather than being folded into a footnote: for a rule
 * whose whole mechanism is syntactic evidence, the limitations *are* the rule.
 */

export function generateStaticParams() {
  return RULES.map((rule) => ({ id: rule.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/rules/[id]">): Promise<Metadata> {
  const { id } = await params;
  const rule = RULES.find((candidate) => candidate.id === id);
  return {
    title: rule === undefined ? `${id} — soroban-lint` : `${rule.id} ${rule.name} — soroban-lint`,
    description: rule?.description,
  };
}

const STABILITY_CLASS = {
  stable: "bg-ok-bg text-ok ring-ok/30",
  experimental: "bg-warn-bg text-warn ring-warn/30",
} as const;

export default async function RulePage({ params }: PageProps<"/rules/[id]">) {
  const { id } = await params;
  const rule = RULES.find((candidate) => candidate.id === id);
  if (rule === undefined) {
    notFound();
  }

  const example = RULE_EXAMPLES[rule.id];
  const playHref = (source: string) => `/#source=${encodeSource(source)}`;

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <Link href="/rules" className="text-sm text-ink-muted hover:text-ink">
          ← All rules
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{rule.id}</h1>
          <span className="font-mono text-sm text-ink-subtle">{rule.name}</span>
          <span
            className={`rounded px-2 py-0.5 text-xs ring-1 ring-inset ${STABILITY_CLASS[rule.stability]}`}
          >
            {rule.stability}
          </span>
        </div>
        <p className="text-lg text-ink">{rule.description}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:max-w-md">
          <dt className="text-ink-muted">Default severity</dt>
          <dd className="font-mono">{rule.default_severity}</dd>
          <dt className="text-ink-muted">Default confidence</dt>
          <dd className="font-mono">{rule.default_confidence}</dd>
          <dt className="text-ink-muted">Enable</dt>
          <dd className="font-mono">
            {rule.stability === "experimental" ? "--experimental" : "on by default"}
          </dd>
        </dl>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-ink">Why it matters</h2>
        <p className="text-ink-muted">{rule.rationale}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-ink">Limitations</h2>
        <p className="rounded-lg border border-warn/40 bg-warn-bg p-4 text-sm text-ink">
          {rule.limitations}
        </p>
        <p className="text-sm text-ink-subtle">
          These are the known false-positive and false-negative modes. A finding from this rule is a
          prompt to read the code, not a verdict.
        </p>
      </section>

      {example?.vulnerable ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">Flagged</h2>
          <p className="text-sm text-ink-muted">
            A real fixture from the core test suite, verified to trigger {rule.id} at generation
            time.
          </p>
          <CodeBlock source={example.vulnerable.source} file={example.vulnerable.fixture} />
          <Link
            href={playHref(example.vulnerable.source)}
            className="text-sm text-ink-muted underline decoration-line underline-offset-2 hover:text-ink"
          >
            Open this in the playground
          </Link>
        </section>
      ) : null}

      {example?.untouched ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">Not flagged</h2>
          <p className="text-sm text-ink-muted">
            Another fixture from the same suite that {rule.id} does not report. It is a negative
            case, not a rewrite of the example above.
          </p>
          <CodeBlock source={example.untouched.source} file={example.untouched.fixture} />
        </section>
      ) : null}

      <footer className="border-t border-line pt-6 text-sm text-ink-muted">
        Suppress a finding you have reviewed with{" "}
        <code className="font-mono">{`// soroban-lint-ignore: ${rule.id}`}</code> on the same line or the
        line above. See <Link href="/docs" className="underline decoration-line underline-offset-2">the docs</Link>.
      </footer>
    </article>
  );
}