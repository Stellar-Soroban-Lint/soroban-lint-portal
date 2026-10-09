"use client";

/**
 * Monaco, isolated behind one module so the workbench can load it with
 * `next/dynamic({ ssr: false })` — the editor needs `window` and must never run
 * during server rendering.
 *
 * Two details matter for a security tool:
 *
 *   - Monaco is bundled from `node_modules` rather than fetched from a CDN, so
 *     the playground works under a strict `script-src` and makes no third-party
 *     request while linting someone's contract.
 *   - Diagnostics become real editor markers, with the rule ID, rationale, and
 *     fix guidance in the hover. A finding the user has to read elsewhere is a
 *     finding they will miss.
 */

import Editor, { loader, type Monaco, type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEffect, useRef } from "react";

import { type Diagnostic, type Severity } from "@/lib/diagnostics";
import { type RuleMeta } from "@/lib/rules";

// Point the loader at the copy `scripts/sync-monaco.mjs` vendors into `public/`,
// so the editor is served from this origin and no request leaves the page. Set at
// module scope, before any <Editor> mounts.
const basePath = process.env["NEXT_PUBLIC_BASE_PATH"] ?? "";
loader.config({ paths: { vs: `${basePath}/monaco/vs` } });

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  diagnostics: readonly Diagnostic[];
  /** Rule metadata, used to build marker hover text. */
  rules: readonly RuleMeta[];
  /** Path shown in the editor's breadcrumb. */
  filePath: string;
  /** `light` or `dark`; follows the portal's theme toggle. */
  theme: "light" | "dark";
  readOnly?: boolean;
}

/** Monaco's own severity scale, which differs from the linter's. */
function markerSeverity(severity: Severity): editor.IMarkerData["severity"] {
  switch (severity) {
    case "error":
      return 8 as editor.IMarkerData["severity"]; // MarkerSeverity.Error
    case "warning":
      return 4 as editor.IMarkerData["severity"]; // MarkerSeverity.Warning
    case "info":
      return 2 as editor.IMarkerData["severity"]; // MarkerSeverity.Info
  }
}

/** The hover body: message, then rationale, then how to fix it. */
function hoverFor(diagnostic: Diagnostic, rule: RuleMeta | undefined): string {
  const lines = [`**${diagnostic.rule_id}** — ${diagnostic.message}`];
  if (rule) {
    lines.push(`\n*Why:* ${rule.rationale}`);
    lines.push(`\n*Limits:* ${rule.limitations}`);
  }
  if (diagnostic.help) {
    lines.push(`\n*Fix:* ${diagnostic.help}`);
  }
  lines.push(`\n*Confidence:* ${diagnostic.confidence}`);
  return lines.join("\n");
}

export default function CodeEditor({
  value,
  onChange,
  diagnostics,
  rules,
  filePath,
  theme,
  readOnly = false,
}: CodeEditorProps) {
  // `onMount` hands back two things: the editor instance first, the Monaco
  // namespace second. Keeping both is what lets the effect below address the
  // editor's *own* model; reading `monaco.editor.getModels()[0]` would grab
  // whatever model happens to exist and crash when the namespace is missing.
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleMount: OnMount = (mounted, monaco) => {
    editorRef.current = mounted;
    monacoRef.current = monaco;
  };

  // Markers live on the model, so they are set through the Monaco instance
  // rather than through props.
  useEffect(() => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) {
      return;
    }
    const byId = new Map(rules.map((rule) => [rule.id, rule]));
    monaco.editor.setModelMarkers(
      model,
      "soroban-lint",
      diagnostics.map((diagnostic) => {
        // The linter counts lines from 1 and columns from 1; Monaco counts both
        // from 1, so only the end positions need clamping.
        const startLine = Math.max(1, diagnostic.start_line);
        const endLine = Math.max(startLine, diagnostic.end_line);
        return {
          severity: markerSeverity(diagnostic.severity),
          message: hoverFor(diagnostic, byId.get(diagnostic.rule_id)),
          startLineNumber: startLine,
          startColumn: Math.max(1, diagnostic.start_column),
          endLineNumber: endLine,
          endColumn: Math.max(diagnostic.end_column, 1),
          // Surfaces the rule ID in the hover's title row.
          code: diagnostic.rule_id,
          source: "soroban-lint",
        };
      }),
    );
  }, [diagnostics, rules, value]);

  return (
    <Editor
      height="30rem"
      language="rust"
      theme={theme === "dark" ? "vs-dark" : "vs"}
      value={value}
      path={filePath}
      onMount={handleMount}
      onChange={(next) => onChange(next ?? "")}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false,
        renderWhitespace: "selection",
        tabSize: 4,
        automaticLayout: true,
        // A linter that cries wolf gets ignored; show the severity gutter mark
        // quietly rather than as an error squiggle everywhere.
        glyphMargin: true,
        folding: true,
        lineNumbersMinChars: 3,
        ariaLabel: `Rust contract source, ${filePath}`,
      }}
      loading={<p className="p-4 text-sm text-slate-500">Loading editor…</p>}
    />
  );
}
