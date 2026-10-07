/**
 * The diagnostic contract, identical to the CLI's `--format json` output.
 * Keeping one shape across CLI, action, and portal is deliberate.
 */

export type Severity = "info" | "warning" | "error";
export type Confidence = "low" | "medium" | "high";

export interface Diagnostic {
  rule_id: string;
  severity: Severity;
  confidence: Confidence;
  message: string;
  file: string;
  start_line: number;
  start_column: number;
  end_line: number;
  end_column: number;
  help: string | null;
  fix: string | null;
}

export interface DiagnosticDocument {
  version: string;
  diagnostics: Diagnostic[];
}

export interface SeverityCounts {
  errors: number;
  warnings: number;
  notices: number;
  total: number;
}

/** Severity ordering, matching the CLI's `--fail-on` comparison. */
const RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/** Parse the JSON document produced by the WASM build. */
export function parseDiagnostics(json: string): DiagnosticDocument {
  const parsed: unknown = JSON.parse(json);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as DiagnosticDocument).diagnostics)
  ) {
    throw new Error("soroban-lint returned an unexpected document");
  }
  return parsed as DiagnosticDocument;
}

/** Count findings per severity. */
export function summarize(diagnostics: readonly Diagnostic[]): SeverityCounts {
  const counts: SeverityCounts = { errors: 0, warnings: 0, notices: 0, total: 0 };
  for (const diagnostic of diagnostics) {
    counts.total += 1;
    if (diagnostic.severity === "error") {
      counts.errors += 1;
    } else if (diagnostic.severity === "warning") {
      counts.warnings += 1;
    } else {
      counts.notices += 1;
    }
  }
  return counts;
}

/** Most severe first, then by position, so the list reads like a report. */
export function sortDiagnostics(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((a, b) => {
    const bySeverity = RANK[a.severity] - RANK[b.severity];
    if (bySeverity !== 0) {
      return bySeverity;
    }
    if (a.start_line !== b.start_line) {
      return a.start_line - b.start_line;
    }
    return a.rule_id.localeCompare(b.rule_id);
  });
}

/** `rule_id severity` label used by the finding cards. */
export function label(diagnostic: Diagnostic): string {
  return `${diagnostic.rule_id} ${diagnostic.severity}`;
}

/** Tailwind classes for a severity chip, from the theme tokens. */
export function severityClasses(severity: Severity): string {
  switch (severity) {
    case "error":
      return "bg-danger-bg text-danger ring-danger/30";
    case "warning":
      return "bg-warn-bg text-warn ring-warn/30";
    case "info":
      return "bg-info-bg text-info ring-info/30";
  }
}
