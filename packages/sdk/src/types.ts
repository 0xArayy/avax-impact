export type Hex = `0x${string}`;

export interface ValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

export interface AttributionResult {
  readonly schemaId: number;
  readonly codes: readonly string[];
  readonly originalCalldata: Hex;
  readonly suffix: Hex;
  readonly suffixLengthBytes: number;
  readonly registryAddress?: Hex;
  readonly registryChainId?: bigint;
}

export interface Schema1Attribution {
  readonly registryAddress: Hex;
  readonly registryChainId: bigint;
  readonly codes: readonly string[];
}

export interface DryRunRequest {
  readonly rpcUrl: string;
  readonly to: Hex;
  readonly calldata: Hex;
  readonly codes: readonly string[];
  /** When both registry fields are present, prepare schema 1. Otherwise legacy schema 0. */
  readonly registryAddress?: Hex;
  readonly registryChainId?: bigint;
  readonly from?: Hex;
  readonly value?: Hex;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

export interface DryRunResult {
  readonly success: boolean;
  readonly originalCalldata: Hex;
  readonly attributedCalldata: Hex;
  readonly selectedCalldata: Hex;
  readonly returnData?: Hex;
  readonly error?: string;
}

export interface RpcClientOptions {
  readonly url: string;
  readonly timeoutMs?: number;
  readonly fetch?: typeof globalThis.fetch;
}

export interface RpcRequestOptions {
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

export type RpcErrorKind =
  | "aborted"
  | "http"
  | "malformed"
  | "rpc"
  | "timeout"
  | "transport";

export interface RpcTransaction {
  readonly hash: Hex;
  readonly input: Hex;
  readonly from: Hex;
  readonly to: Hex | null;
  readonly value: Hex;
  readonly blockNumber: Hex | null;
}

export interface TransactionFetchRequest extends RpcRequestOptions {
  readonly rpcUrl: string;
  readonly transactionHash: Hex;
  readonly expectedChainId?: number;
}

export type AttributionAnalysis =
  | { readonly status: "declared"; readonly declaration: AttributionResult }
  | { readonly status: "unattributed" }
  | { readonly status: "malformed"; readonly error: string };

export interface TransactionAnalysis {
  readonly chainId: number;
  readonly transaction: RpcTransaction;
  readonly attribution: AttributionAnalysis;
}

/** AVAX Impact Fuji extension record; not the standard code-registry ABI. */
export interface LegacyBuilderRecord {
  readonly code: string;
  readonly owner: Hex;
  readonly payoutAddress: Hex;
  readonly metadataURI: string;
  readonly registeredAt: number;
  readonly active: boolean;
}

export type LegacyBuilderResolution =
  | {
      readonly status: "registered-active" | "registered-inactive";
      readonly record: LegacyBuilderRecord;
    }
  | { readonly status: "unregistered"; readonly code: string };

export interface ResolveBuilderRequest extends RpcRequestOptions {
  readonly rpcUrl: string;
  readonly registryAddress: Hex;
  readonly code: string;
  readonly blockTag?: Hex | "latest" | "safe" | "finalized";
}

export interface CodeRegistryRecord {
  readonly code: string;
  readonly payoutAddress: Hex;
  readonly codeURI: string;
  readonly valid: boolean;
}

export type CodeRegistryResolution =
  | { readonly status: "registered"; readonly record: CodeRegistryRecord }
  | { readonly status: "unregistered"; readonly code: string; readonly valid: boolean };
