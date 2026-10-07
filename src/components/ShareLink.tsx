"use client";

import { useCallback, useState } from "react";

import { MAX_SOURCE_LENGTH, SnippetTooLongError, shareUrl } from "@/lib/share";

/**
 * Copy a link to the current editor contents.
 *
 * The snippet travels in the URL fragment, which browsers do not send to servers,
 * so sharing a contract does not publish it. The button says so when it copies,
 * because "share" in a security tool should not quietly upload code.
 */
export default function ShareLink({ source }: { source: string }) {
  const [state, setState] = useState<"idle" | "copied" | "too-long" | "failed">("idle");

  const copy = useCallback(async () => {
    let url: string;
    try {
      url = shareUrl(window.location.href, source);
    } catch (error) {
      setState(error instanceof SnippetTooLongError ? "too-long" : "failed");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      // Keep the address bar in step, so the reader can share by hand too.
      window.history.replaceState(null, "", url);
      setState("copied");
    } catch {
      setState("failed");
    }
  }, [source]);

  const message =
    state === "copied"
      ? "Link copied"
      : state === "too-long"
        ? `Too long to share (limit ${MAX_SOURCE_LENGTH} characters)`
        : state === "failed"
          ? "Copy failed — the link is in the address bar"
          : "Copy share link";

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        data-testid="share-link"
        className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:bg-raised"
      >
        {message}
      </button>
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? "Share link copied to the clipboard." : ""}
      </span>
    </span>
  );
}