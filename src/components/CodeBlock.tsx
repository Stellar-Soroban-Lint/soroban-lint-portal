/**
 * A read-only Rust snippet.
 *
 * Static markup rather than Monaco: a rule reference page is server-rendered and
 * has to be readable with scripting disabled, and loading a second editor on every
 * rule page would cost far more than it is worth for code nobody edits.
 */

export default function CodeBlock({ source, file }: { source: string; file: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-surface">
      <figcaption className="border-b border-line bg-raised px-3 py-1.5 font-mono text-xs text-ink-subtle">
        {file}
      </figcaption>
      {/* `tabIndex` because the block scrolls horizontally: a keyboard user must be
          able to reach it to scroll it. */}
      <pre tabIndex={0} className="overflow-x-auto p-3 text-xs leading-relaxed text-ink">
        <code>{source}</code>
      </pre>
    </figure>
  );
}