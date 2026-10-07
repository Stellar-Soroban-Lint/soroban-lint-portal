/**
 * Type declaration for the vendored WebAssembly binary.
 *
 * `next.config.ts` emits `*.wasm` as a build asset, so importing one yields the
 * content-hashed URL string instead of bytes. TypeScript only consults this file
 * because `allowArbitraryExtensions` is on in `tsconfig.json`; without it, the
 * import would silently type as an empty object.
 */
declare const url: string;
export default url;
