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
  /** Registry context embedded in the canonical schema 1 suffix. */
  readonly registryAddress: Hex;
  readonly registryChainId: bigint;
  readonly from?: Hex;
  readonly value?: Hex;
  /**
   * Exact block used for both the original and attributed eth_call.
   * When omitted, the SDK resolves eth_blockNumber once and pins both simulations to it.
   */
  readonly blockTag?: Hex;
  /**
   * Controls when the untouched payload may be selected after a failed simulation.
   * Defaults to `revert-only`; infrastructure failures never silently become a sendable call.
   */
  readonly fallbackPolicy?: FallbackPolicy;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

export type FallbackPolicy = "revert-only" | "never";

export type DryRunFailureKind =
  | RpcErrorKind
  | "execution-reverted"
  | "invalid-result"
  | "return-data-mismatch";

export type DryRunStage = "block-pinning" | "original-call" | "attributed-call" | "comparison";

interface DryRunResultBase {
  readonly originalCalldata: Hex;
  readonly attributedCalldata: Hex;
  readonly blockTag: Hex | null;
  readonly originalReturnData?: Hex;
  readonly attributedReturnData?: Hex;
}

export type DryRunResult =
  | (DryRunResultBase & {
      readonly success: true;
      readonly status: "attributed";
      readonly selectedCalldata: Hex;
      readonly returnData: Hex;
      readonly originalReturnData: Hex;
      readonly attributedReturnData: Hex;
      readonly blockTag: Hex;
      readonly compatibilityEvidence: "return-data-match";
    })
  | (DryRunResultBase & {
      readonly success: false;
      readonly status: "fallback";
      readonly selectedCalldata: Hex;
      readonly failureKind: DryRunFailureKind;
      readonly failedStage: "attributed-call";
      readonly originalReturnData: Hex;
      readonly blockTag: Hex;
      readonly error: string;
    })
  | (DryRunResultBase & {
      readonly success: false;
      readonly status: "blocked";
      readonly selectedCalldata: null;
      readonly failureKind: DryRunFailureKind;
      readonly failedStage: DryRunStage;
      readonly error: string;
    });

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

export interface RpcTransactionReceipt {
  readonly transactionHash: Hex;
  readonly blockNumber: Hex;
  readonly status: Hex;
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

export interface ConfirmedTransactionAnalysis extends TransactionAnalysis {
  readonly receipt: RpcTransactionReceipt;
}

export interface DataSuffixCapabilityRequest {
  readonly codes: readonly string[];
  readonly registryAddress: Hex;
  readonly registryChainId: bigint;
  /** Whether a wallet may ignore the capability. Defaults to false. */
  readonly optional?: boolean;
}

export interface DataSuffixCapability {
  readonly dataSuffix: {
    readonly value: Hex;
    readonly optional: boolean;
  };
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
