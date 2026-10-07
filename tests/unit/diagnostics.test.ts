import { describe, expect, it } from "vitest";

import {
  label,
  parseDiagnostics,
  severityClasses,
  sortDiagnostics,
  summarize,
  type Diagnostic,
} from "@/lib/diagnostics";

function diagnostic(overrides: Partial<Diagnostic> = {}): Diagnostic {
  return {
    rule_id: "SL001",
    severity: "error",
    confidence: "medium",
    message: "`set_balance` mutates state without an authorization check",
    file: "contracts/token/src/lib.rs",
    start_line: 10,
    start_column: 12,
    end_line: 10,
    end_column: 23,
    help: "call `require_auth()` first",
    fix: "addr.require_auth()",
    ...overrides,
  };
}

describe("parseDiagnostics", () => {
  it("accepts the document the CLI and WASM build emit", () => {
    const document = parseDiagnostics('{"version":"1","diagnostics":[]}');
    expect(document.version).toBe("1");
    expect(document.diagnostics).toEqual([]);
  });

  it("rejects anything that is not a diagnostics document", () => {
    expect(() => parseDiagnostics("not json")).toThrow();
    expect(() => parseDiagnostics('{"version":"1"}')).toThrow(
      /unexpected document/,
    );
  });
});

describe("summarize", () => {
  it("counts each severity and the total", () => {
    expect(
      summarize([
        diagnostic({ severity: "error" }),
        diagnostic({ severity: "warning" }),
        diagnostic({ severity: "warning" }),
        diagnostic({ severity: "info" }),
      ]),
    ).toEqual({ errors: 1, warnings: 2, notices: 1, total: 4 });
  });

  it("returns zeroes for an empty run", () => {
    expect(summarize([])).toEqual({ errors: 0, warnings: 0, notices: 0, total: 0 });
  });
});

describe("sortDiagnostics", () => {
  it("puts the most severe finding first, then orders by position", () => {
    const sorted = sortDiagnostics([
      diagnostic({ rule_id: "SL005", severity: "info", start_line: 2 }),
      diagnostic({ rule_id: "SL002", severity: "warning", start_line: 40 }),
      diagnostic({ rule_id: "SL001", severity: "error", start_line: 30 }),
      diagnostic({ rule_id: "SL003", severity: "warning", start_line: 10 }),
    ]);
    expect(sorted.map((d) => d.rule_id)).toEqual(["SL001", "SL003", "SL002", "SL005"]);
  });

  it("does not mutate its input", () => {
    const input = [diagnostic({ severity: "info" }), diagnostic({ severity: "error" })];
    const before = input.map((d) => d.severity);
    sortDiagnostics(input);
    expect(input.map((d) => d.severity)).toEqual(before);
  });
});

describe("labels", () => {
  it("labels a finding for display", () => {
    expect(label(diagnostic())).toBe("SL001 error");
  });

  it("gives each severity a distinct chip style", () => {
    const styles = new Set([
      severityClasses("error"),
      severityClasses("warning"),
      severityClasses("info"),
    ]);
    expect(styles.size).toBe(3);
  });
});
