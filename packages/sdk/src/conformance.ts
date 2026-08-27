import type { Hex } from "./types.js";

export interface ConformanceVector {
  readonly format:
    | "avax-impact/schema-0@0.1.0"
    | "erc-8021@457532f5c064a4619868ee5e4950f0cc32a7917e";
  readonly name: string;
  readonly calldata: Hex;
  readonly outcome:
    | {
        readonly status: "declared";
        readonly schemaId: 0 | 1;
        readonly codes: readonly string[];
        readonly originalCalldata: Hex;
        readonly registryAddress?: Hex;
        readonly registryChainId?: bigint;
      }
    | { readonly status: "unattributed" }
    | { readonly status: "malformed"; readonly errorIncludes: string };
}

/** Shared schema-0/schema-1 vectors for SDK consumers and other AVAX Impact surfaces. */
export const CONFORMANCE_VECTORS: readonly ConformanceVector[] = [
  {
    name: "pinned ERC-8021 schema-1 example",
    format: "erc-8021@457532f5c064a4619868ee5e4950f0cc32a7917e",
    calldata:
      "0xddddddddcccccccccccccccccccccccccccccccccccccccc210502626173656170702c6d6f7270686f0e0180218021802180218021802180218021",
    outcome: {
      status: "declared",
      schemaId: 1,
      codes: ["baseapp", "morpho"],
      originalCalldata: "0xdddddddd",
      registryAddress: "0xcccccccccccccccccccccccccccccccccccccccc",
      registryChainId: 8453n,
    },
  },
  {
    name: "single declaration",
    format: "avax-impact/schema-0@0.1.0",
    calldata:
      "0x1234617661782d696d706163740b0080218021802180218021802180218021",
    outcome: {
      status: "declared",
      schemaId: 0,
      codes: ["avax-impact"],
      originalCalldata: "0x1234",
    },
  },
  {
    name: "no marker",
    format: "avax-impact/schema-0@0.1.0",
    calldata: "0x1234",
    outcome: { status: "unattributed" },
  },
  {
    name: "registry-defined one-byte and repeated codes",
    format: "erc-8021@457532f5c064a4619868ee5e4950f0cc32a7917e",
    calldata:
      "0x1234cccccccccccccccccccccccccccccccccccccccc210502412c41030180218021802180218021802180218021",
    outcome: {
      status: "declared",
      schemaId: 1,
      codes: ["A", "A"],
      originalCalldata: "0x1234",
      registryAddress: "0xcccccccccccccccccccccccccccccccccccccccc",
      registryChainId: 8453n,
    },
  },
  {
    name: "unknown schema",
    format: "avax-impact/schema-0@0.1.0",
    calldata:
      "0x1234617661782d696d706163740b0280218021802180218021802180218021",
    outcome: { status: "malformed", errorIncludes: "unsupported attribution schema" },
  },
  {
    name: "declared length crosses calldata start",
    format: "avax-impact/schema-0@0.1.0",
    calldata: "0x01ff0080218021802180218021802180218021",
    outcome: { status: "malformed", errorIncludes: "more builder-code bytes" },
  },
] as const;
