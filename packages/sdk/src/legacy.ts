/**
 * Read and reproduction helpers for the historical AVAX Impact schema 0 proof.
 *
 * New integrations should import from `@avax-impact/sdk` and use schema 1. This
 * subpath exists so historical evidence remains reproducible without making the
 * registry-less format part of the default API surface.
 */
export {
  appendLegacyAttribution,
  encodeLegacyAttribution,
} from "./codec.js";
export { resolveLegacyBuilder } from "./registry.js";
export { LEGACY_FORMAT_VERSION } from "./constants.js";
export type {
  LegacyBuilderRecord,
  LegacyBuilderResolution,
  ResolveBuilderRequest,
} from "./types.js";
