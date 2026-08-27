import {
  analyzeTransaction,
  decodeAttribution,
  detectAttribution,
  encodeResolveCall,
  prepareAttributedCall,
  type AttributionAnalysis,
  type AttributionResult,
  type DryRunResult,
  type Hex,
  type RpcTransaction,
} from "@avax-impact/sdk";
import {
  resolveLegacyBuilder,
  type LegacyBuilderResolution,
} from "@avax-impact/sdk/legacy";
import { SAMPLE_STRICT_CALLDATA } from "@/lib/presentation.mjs";

export const FUJI = {
  chainId: 43_113,
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  registryAddress: "0x8f13a300f2773EB6fa071B9196f6e16129F2549F" as Hex,
  historicalRegistryAddress: "0x8f13a300f2773EB6fa071B9196f6e16129F2549F" as Hex,
  strictCalldataDemoAddress: "0x854595b7260f1325f643dd732F926c6B5da3bf8E" as Hex,
  explorerUrl: "https://build.avax.network/explorer/fuji/c-chain",
} as const;

export const SAMPLE_TRANSACTION =
  "0x33c0fb7ee4f48276dd237d67c4f8186b2416d2a033a90068d12efed63c8f0821" as Hex;
export const SAMPLE_CALLDATA =
  "0x773acdef0000000000000000000000000000000000000000000000000000000000000029617661782d696d706163740b0080218021802180218021802180218021" as Hex;
export const SAMPLE_PREFLIGHT_CALLDATA = encodeResolveCall("avax-impact");
export { SAMPLE_STRICT_CALLDATA };

export interface InspectResult {
  readonly source: "fuji-rpc" | "local-calldata";
  readonly analysis: AttributionAnalysis;
  readonly transaction?: RpcTransaction;
  readonly chainId?: number;
}

export interface LegacyResolutionResult {
  readonly code: string;
  readonly resolution?: LegacyBuilderResolution;
  readonly error?: string;
}

export async function inspectFujiTransaction(
  transactionHash: Hex,
  signal?: AbortSignal,
): Promise<InspectResult> {
  const result = await analyzeTransaction({
    rpcUrl: FUJI.rpcUrl,
    transactionHash,
    expectedChainId: FUJI.chainId,
    timeoutMs: 12_000,
    signal,
  });
  return {
    source: "fuji-rpc",
    analysis: result.attribution,
    transaction: result.transaction,
    chainId: result.chainId,
  };
}

export function inspectRawCalldata(calldata: Hex): InspectResult {
  let analysis: AttributionAnalysis;
  if (!detectAttribution(calldata)) {
    analysis = { status: "unattributed" };
  } else {
    try {
      analysis = { status: "declared", declaration: decodeAttribution(calldata) };
    } catch (error) {
      analysis = {
        status: "malformed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  return { source: "local-calldata", analysis };
}

export async function resolveHistoricalCodes(
  declaration: AttributionResult,
  signal?: AbortSignal,
): Promise<readonly LegacyResolutionResult[]> {
  if (declaration.schemaId !== 0) return [];
  return Promise.all(
    declaration.codes.map(async (code) => {
      try {
        const resolution = await resolveLegacyBuilder({
          rpcUrl: FUJI.rpcUrl,
          registryAddress: FUJI.historicalRegistryAddress,
          code,
          timeoutMs: 12_000,
          signal,
        });
        return { code, resolution };
      } catch (error) {
        return { code, error: error instanceof Error ? error.message : String(error) };
      }
    }),
  );
}

export interface PreflightInput {
  readonly to: Hex;
  readonly calldata: Hex;
  readonly codes: readonly string[];
  readonly from?: Hex;
  readonly value?: Hex;
  readonly signal?: AbortSignal;
}

export function preflightFujiCall(input: PreflightInput): Promise<DryRunResult> {
  return prepareAttributedCall({
    rpcUrl: FUJI.rpcUrl,
    to: input.to,
    calldata: input.calldata,
    codes: input.codes,
    registryAddress: FUJI.registryAddress,
    registryChainId: BigInt(FUJI.chainId),
    from: input.from,
    value: input.value,
    timeoutMs: 12_000,
    signal: input.signal,
  });
}
