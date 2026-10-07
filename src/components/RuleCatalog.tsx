import Link from "next/link";

import type { RuleCatalog as Catalog } from "@/lib/rules";

/**
 * The rule list in the playground sidebar.
 *
 * The metadata comes from the WASM build's own `rules --format json`, so the table
 * cannot describe a rule set that differs from the one producing the findings
 * beside it.
 */
export default function RuleCatalog({ catalog }: { catalog: Catalog | null }) {
  if (catalog === null) {
    return null;
  }
  return (
    <details className="rounded-lg border border-line bg-surface p-4" data-testid="rule-catalog">
      <summary className="cursor-pointer text-sm font-semibold text-ink">
        {catalog.rules.length} registered rules
      </summary>
      <p className="mt-2 text-xs text-ink-muted">
        Rule IDs are permanent. Experimental rules run only when the toggle is on.{" "}
        <Link href="/rules" className="underline decoration-line underline-offset-2 hover:text-ink">
          Full rule reference
        </Link>
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">
            Registered rules with their default severity and stability
          </caption>
          <thead className="text-ink-subtle">
            <tr>
              <th scope="col" className="py-1 pr-3 font-medium">
                ID
              </th>
              <th scope="col" className="py-1 pr-3 font-medium">
                Name
              </th>
              <th scope="col" className="py-1 pr-3 font-medium">
                Severity
              </th>
              <th scope="col" className="py-1 pr-3 font-medium">
                Stability
              </th>
              <th scope="col" className="py-1 font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="text-ink">
            {catalog.rules.map((rule) => (
              <tr key={rule.id} className="border-t border-line align-top">
                <td className="py-1 pr-3 font-mono">
                  <Link href={`/rules/${rule.id}`} className="hover:underline">
                    {rule.id}
                  </Link>
                </td>
                <td className="py-1 pr-3 font-mono">{rule.name}</td>
                <td className="py-1 pr-3">{rule.default_severity}</td>
                <td className="py-1 pr-3">{rule.stability}</td>
                <td className="py-1">{rule.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}