/* tslint:disable */
/* eslint-disable */

/**
 * Lint one source file and return the JSON diagnostics document.
 *
 * `path` is only used to label findings, exactly as in the CLI. `experimental`
 * enables SL003-SL007.
 */
export function lintSource(path: string, source: string, experimental: boolean): string;

/**
 * The rule catalog as JSON, matching `soroban-lint rules --format json`.
 */
export function rulesJson(): string;

/**
 * Install a panic hook so Rust panics surface as console errors instead of
 * `unreachable executed`. Runs automatically when the module is initialised.
 */
export function start(): void;

/**
 * The crate version, e.g. `0.1.0`.
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly lintSource: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly rulesJson: () => [number, number];
    readonly start: () => void;
    readonly version: () => [number, number];
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
