import Link from "next/link";

import {
  label,
  severityClasses,
  type Diagnostic,
  type SeverityCounts,
} from "@/lib/diagnostics";

export interface FindingsPanelProps {
  diagnostics: Diagnostic[];
  counts: SeverityCounts;
  /** True once a lint run has completed, so an empty list can be trusted. */
  hasRun: boolean;
}

function CountChip({ name, value, className }: { name: string; value: number; className: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      <span className="font-mono">{value}</span>
      {name}
    </span>
  );
}

export default function FindingsPanel({ diagnostics, counts, hasRun }: FindingsPanelProps) {
  return (
    <section className="flex flex-col gap-3" aria-label="Findings">
      <div className="flex flex-wrap items-center gap-2" data-testid="summary">
        <CountChip
          name={counts.total === 1 ? "finding" : "findings"}
          value={counts.total}
          className="bg-raised text-ink ring-line"
        />
        <CountChip
          name="errors"
          value={counts.errors}
          className="bg-danger-bg text-danger ring-danger/30"
        />
        <CountChip
          name="warnings"
          value={counts.warnings}
          className="bg-warn-bg text-warn ring-warn/30"
        />
        <CountChip
          name="info"
          value={counts.notices}
          className="bg-info-bg text-info ring-info/30"
        />
      </div>

      {hasRun && diagnostics.length === 0 ? (
        <p
          className="rounded-lg border border-ok/40 bg-ok-bg p-4 text-sm text-ok"
          data-testid="empty-state"
        >
          No findings. A clean report is not evidence the contract is secure.
        </p>
      ) : null}

      <ul className="flex flex-col gap-2" data-testid="findings">
        {diagnostics.map((diagnostic, index) => (
          <li
            key={`${diagnostic.rule_id}-${diagnostic.start_line}-${diagnostic.start_column}-${index}`}
            className="rounded-lg border border-line bg-surface p-3 shadow-sm"
            data-testid="finding"
            data-rule={diagnostic.rule_id}
            data-line={diagnostic.start_line}
            data-column={diagnostic.start_column}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-semibold ring-1 ring-inset ${severityClasses(
                  diagnostic.severity,
                )}`}
              >
                {label(diagnostic)}
              </span>
              <Link
                href={`/rules/${diagnostic.rule_id}`}
                className="text-xs text-ink-muted underline decoration-line underline-offset-2 hover:text-ink"
              >
                {diagnostic.file}:{diagnostic.start_line}:{diagnostic.start_column}
              </Link>
              <span className="text-xs text-ink-subtle">{diagnostic.confidence} confidence</span>
            </div>
            <p className="mt-2 text-sm text-ink">{diagnostic.message}</p>
            {diagnostic.help ? (
              <p className="mt-1 text-xs text-ink-muted">
                <span className="font-semibold">Help:</span> {diagnostic.help}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}