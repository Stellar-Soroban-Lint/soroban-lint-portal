import { SCOPE_STATEMENT } from "@/lib/scope";

/**
 * Renders the scope statement from the shared constant.
 *
 * Backticked spans become `<code>`, so the *rendered* words match
 * `SCOPE_STATEMENT_PLAIN` while the source keeps the backticks `SPEC.md` has.
 */
export default function ScopeStatement() {
  const parts = SCOPE_STATEMENT.split("`");
  return (
    <blockquote
      className="rounded-lg border-l-4 border-accent bg-raised p-4 text-sm leading-relaxed text-ink"
      data-testid="scope-statement"
    >
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <code key={index} className="rounded bg-canvas px-1 py-0.5 font-mono text-[0.8rem]">
            {part}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </blockquote>
  );
}