import type { Hex } from "./types.js";

export const ERC_8021_MARKER: Hex = "0x80218021802180218021802180218021";
export const SCHEMA_ID = 0;
export const SCHEMA_ID_V1 = 1;
/** Exact ERC-8021 draft revision implemented by the schema-1 helpers. */
export const ATTRIBUTION_FORMAT_VERSION =
  "erc-8021@457532f5c064a4619868ee5e4950f0cc32a7917e";
export const LEGACY_FORMAT_VERSION = "avax-impact/schema-0@0.1.0";
export const REGISTRY_KIND = "avax-impact-builder-registry@0.1.0";
export const MIN_CODE_LENGTH = 3;
export const MAX_CODE_LENGTH = 32;
export const MAX_CODES = 4;
export const MAX_JOINED_CODES_LENGTH = 255;
