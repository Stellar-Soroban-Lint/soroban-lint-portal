/**
 * Shareable snippet links, carried entirely in the URL fragment.
 *
 * The fragment is never sent to a server, so a contract pasted here does not
 * leave the browser. That is a property of the URL, not a promise: `location.hash`
 * is not part of an HTTP request, and this portal has no backend to forward it
 * to. The playground makes no network call except fetching its own WASM binary.
 *
 * The encoding is base64url of UTF-8, which is reversible without a compression
 * library. Long contracts make a long link, and browsers cap URLs around 64 KiB;
 * `MAX_SOURCE_LENGTH` keeps the failure explicit instead of producing a link that
 * silently truncates.
 */

/** Refuse to build a link the browser would likely truncate. */
export const MAX_SOURCE_LENGTH = 40_000;

export class SnippetTooLongError extends Error {
  constructor(public readonly length: number, public readonly limit: number) {
    super(`source is ${length} characters; share links are limited to ${limit}`);
    this.name = "SnippetTooLongError";
  }
}

/** Encode source text into the fragment body. */
export function encodeSource(source: string): string {
  const bytes = new TextEncoder().encode(source);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

/** Decode a fragment body back into source text. */
export function decodeSource(encoded: string): string {
  const base64 = encoded.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** The full URL for a snippet, preserving the path and query already in `href`. */
export function shareUrl(href: string, source: string): string {
  if (source.length > MAX_SOURCE_LENGTH) {
    throw new SnippetTooLongError(source.length, MAX_SOURCE_LENGTH);
  }
  const base = new URL(href);
  base.hash = `source=${encodeSource(source)}`;
  return base.toString();
}

/**
 * Read a snippet out of a fragment.
 *
 * Returns `null` for an absent or unparseable fragment rather than throwing: a
 * hand-edited link should land on an empty editor, not an error page.
 */
export function readSnippet(hash: string): string | null {
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  if (withoutHash === "") {
    return null;
  }
  try {
    const params = new URLSearchParams(withoutHash);
    const encoded = params.get("source");
    if (encoded === null || encoded === "") {
      return null;
    }
    const source = decodeSource(encoded);
    // Reject anything that did not survive a round trip; a corrupted fragment
    // should not silently produce different code than the link described.
    return encodeSource(source) === encoded ? source : null;
  } catch {
    return null;
  }
}

/**
 * The URL fragment as an external store.
 *
 * The playground loads a snippet from `location.hash` when the page opens. Doing
 * that in a mount effect would set state synchronously during the effect and
 * cascade a render; subscribing to `hashchange` instead keeps the fragment the
 * single source of truth and lets the editor react to it without an effect.
 */
export function readHash(): string {
  return typeof window === "undefined" ? "" : window.location.hash;
}

/** Subscribe to changes of the URL fragment. */
export function subscribeHash(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

/**
 * Drop the fragment.
 *
 * `history.replaceState` does not emit `hashchange`, so the store would keep
 * reporting the old fragment; dispatching the event keeps it in step.
 */
export function clearHash(): void {
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}