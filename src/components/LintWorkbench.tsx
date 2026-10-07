"use client";

/**
 * The whole interactive surface. Everything below runs in the browser against
 * the real WebAssembly build of `soroban-lint-core`; there is no server-side
 * fallback, so a failure to instantiate the module is visible rather than
 * silently swallowed.
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import FindingsPanel from "@/components/FindingsPanel";
import RuleCatalog from "@/components/RuleCatalog";
import ShareLink from "@/components/ShareLink";
import { SAMPLES } from "@/generated/samples";
import {
  parseDiagnostics,
  sortDiagnostics,
  summarize,
  type Diagnostic,
  type SeverityCounts,
} from "@/lib/diagnostics";
import { parseRuleCatalog, type RuleCatalog as Catalog } from "@/lib/rules";
import type { Sample } from "@/lib/samples";
import { clearHash, readHash, readSnippet, subscribeHash } from "@/lib/share";
import { readTheme, subscribeTheme } from "@/lib/theme";
import { lintSourceJson, loadLinter, ruleCatalogJson, wasmVersion } from "@/wasm";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <p className="h-[30rem] rounded bg-raised p-4 text-sm text-ink-subtle">Loading editor…</p>
  ),
});

const EMPTY_COUNTS: SeverityCounts = { errors: 0, warnings: 0, notices: 0, total: 0 };

/** Long enough to ignore a keystroke, short enough to feel live. */
const DEBOUNCE_MS = 200;

type Status = "loading" | "ready" | "error";

const DEFAULT_SAMPLE = SAMPLES[0]!;

export default function LintWorkbench() {
  const [sample, setSample] = useState<Sample>(DEFAULT_SAMPLE);
  // `null` means "show whatever the source of truth says"; a string is the user's
  // own edit. Keeping the edit separate from the derived value is what lets the
  // URL fragment (an external store) and the sample buttons share one editor
  // without an effect that sets state on mount.
  const [edited, setEdited] = useState<string | null>(null);
  const [experimental, setExperimental] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [counts, setCounts] = useState<SeverityCounts>(EMPTY_COUNTS);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [version, setVersion] = useState("");
  const [status, setStatus] = useState<Status>("loading");
  const [problem, setProblem] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  // Both the theme and the URL fragment are read as external stores, so neither
  // needs a mount effect that would set state during the effect body.
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light" as const);
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const linked = useMemo(() => readSnippet(hash), [hash]);

  const source = edited ?? linked ?? sample.source;
  const fromLink = edited === null && linked !== null;

  // `run` is intentionally not an effect dependency: linting is driven by an
  // explicit debounce below so typing in the editor stays responsive.
  const run = useCallback((text: string, useExperimental: boolean, path: string) => {
    const started = performance.now();
    const document = parseDiagnostics(lintSourceJson(path, text, useExperimental));
    const sorted = sortDiagnostics(document.diagnostics);
    setDiagnostics(sorted);
    setCounts(summarize(sorted));
    setDurationMs(performance.now() - started);
    setHasRun(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadLinter()
      .then(() => {
        if (cancelled) {
          return;
        }
        setVersion(wasmVersion());
        setCatalog(parseRuleCatalog(ruleCatalogJson()));
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProblem(error instanceof Error ? error.message : String(error));
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }
    const timer = setTimeout(() => {
      try {
        run(source, experimental, sample.path);
        setProblem("");
      } catch (error: unknown) {
        setProblem(error instanceof Error ? error.message : String(error));
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [status, source, experimental, sample.path, run]);

  const loadSample = (next: Sample) => {
    setSample(next);
    setEdited(null);
    // A new sample should not leave the previous snippet in the URL.
    clearHash();
  };

  const runNow = () => {
    try {
      run(source, experimental, sample.path);
      setProblem("");
    } catch (error: unknown) {
      setProblem(error instanceof Error ? error.message : String(error));
    }
  };

  const statusText = useMemo(() => {
    if (status === "loading") {
      return "Instantiating WebAssembly…";
    }
    if (status === "error") {
      return `WebAssembly failed to load: ${problem}`;
    }
    return `soroban-lint-wasm ${version}`;
  }, [status, problem, version]);

  return (
    <div className="flex flex-col gap-4" data-testid="workbench" data-status={status}>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sample contracts">
        {SAMPLES.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            onClick={() => loadSample(candidate)}
            data-testid={`sample-${candidate.id}`}
            aria-pressed={candidate.id === sample.id && !fromLink}
            className={`rounded-md border px-3 py-1.5 text-sm transition ${
              candidate.id === sample.id && !fromLink
                ? "border-accent bg-accent text-accent-ink"
                : "border-line bg-surface text-ink hover:bg-raised"
            }`}
          >
            {candidate.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-ink-muted" data-testid="sample-blurb">
        {fromLink
          ? "Loaded from a share link. Nothing was uploaded; the source came from this page's URL fragment."
          : sample.blurb}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-lg border border-line">
            <CodeEditor
              value={source}
              onChange={(next) => {
                setEdited(next);
              }}
              diagnostics={diagnostics}
              rules={catalog?.rules ?? []}
              filePath={sample.path}
              theme={theme}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={runNow}
              data-testid="run-lint"
              disabled={status !== "ready"}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:opacity-50"
            >
              Run lint
            </button>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={experimental}
                onChange={(event) => setExperimental(event.target.checked)}
                data-testid="experimental-toggle"
                className="size-4 rounded border-line"
              />
              Enable experimental rules
            </label>

            <ShareLink source={source} />

            <span
              className={`text-xs ${status === "error" ? "text-danger" : "text-ink-subtle"}`}
              data-testid="wasm-status"
            >
              {statusText}
            </span>
            {durationMs !== null ? (
              <span className="text-xs text-ink-subtle" data-testid="lint-timing">
                {durationMs.toFixed(1)} ms
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <FindingsPanel diagnostics={diagnostics} counts={counts} hasRun={hasRun} />
          <RuleCatalog catalog={catalog} />
        </div>
      </div>
    </div>
  );
}