import { appendAttribution, appendAttributionV1 } from "./codec.js";
import { assertAddress, assertHex, assertRpcQuantity } from "./hex.js";
import { JsonRpcClient, JsonRpcError } from "./rpc.js";
import type {
  DryRunFailureKind,
  DryRunRequest,
  DryRunResult,
  DryRunStage,
  FallbackPolicy,
  Hex,
} from "./types.js";

export async function prepareAttributedCall(request: DryRunRequest): Promise<DryRunResult> {
  assertAddress(request.to, "to");
  assertHex(request.calldata, "calldata");
  if (request.from !== undefined) assertAddress(request.from, "from");
  if (request.value !== undefined) assertRpcQuantity(request.value, "value");

  if ((request.registryAddress === undefined) !== (request.registryChainId === undefined)) {
    throw new Error("registryAddress and registryChainId must be provided together");
  }
  const fallbackPolicy = request.fallbackPolicy ?? "revert-only";
  assertFallbackPolicy(fallbackPolicy);
  if (request.blockTag !== undefined) assertRpcQuantity(request.blockTag, "blockTag");

  const attributedCalldata =
    request.registryAddress === undefined || request.registryChainId === undefined
      ? appendAttribution(request.calldata, request.codes)
      : appendAttributionV1(request.calldata, {
          registryAddress: request.registryAddress,
          registryChainId: request.registryChainId,
          codes: request.codes,
        });
  const originalTransaction: Record<string, Hex> = {
    to: request.to,
    data: request.calldata,
  };
  if (request.from !== undefined) originalTransaction.from = request.from;
  if (request.value !== undefined) originalTransaction.value = request.value;
  const attributedTransaction = { ...originalTransaction, data: attributedCalldata };

  const client = new JsonRpcClient({
    url: request.rpcUrl,
    timeoutMs: request.timeoutMs,
  });

  let blockTag: Hex;
  try {
    blockTag = request.blockTag ?? await requestString(
      client,
      "eth_blockNumber",
      [],
      request,
    );
    assertRpcQuantity(blockTag, "eth_blockNumber result");
  } catch (error) {
    return blockedResult(
      request.calldata,
      attributedCalldata,
      null,
      "block-pinning",
      classifyFailure(error),
      errorMessage(error),
    );
  }

  const original = await simulateCall(client, originalTransaction, blockTag, request);
  if (!original.success) {
    return blockedResult(
      request.calldata,
      attributedCalldata,
      blockTag,
      "original-call",
      original.failureKind,
      `Original call did not establish a viable baseline: ${original.error}`,
    );
  }

  const attributed = await simulateCall(client, attributedTransaction, blockTag, request);
  if (!attributed.success) {
    return attributedFailureResult(
      request.calldata,
      attributedCalldata,
      blockTag,
      original.returnData,
      fallbackPolicy,
      attributed.failureKind,
      attributed.error,
    );
  }

  if (original.returnData.toLowerCase() !== attributed.returnData.toLowerCase()) {
    return blockedResult(
      request.calldata,
      attributedCalldata,
      blockTag,
      "comparison",
      "return-data-mismatch",
      "Original and attributed eth_call returned different data at the same block",
      original.returnData,
      attributed.returnData,
    );
  }

  return {
    success: true,
    status: "attributed",
    originalCalldata: request.calldata,
    attributedCalldata,
    selectedCalldata: attributedCalldata,
    returnData: attributed.returnData,
    originalReturnData: original.returnData,
    attributedReturnData: attributed.returnData,
    blockTag,
    compatibilityEvidence: "return-data-match",
  };
}

function attributedFailureResult(
  originalCalldata: Hex,
  attributedCalldata: Hex,
  blockTag: Hex,
  originalReturnData: Hex,
  fallbackPolicy: FallbackPolicy,
  failureKind: DryRunFailureKind,
  error: string,
): DryRunResult {
  const mayFallback = fallbackPolicy === "any-error"
    || (fallbackPolicy === "revert-only" && failureKind === "execution-reverted");
  if (!mayFallback) {
    return {
      success: false,
      status: "blocked",
      originalCalldata,
      attributedCalldata,
      blockTag,
      originalReturnData,
      selectedCalldata: null,
      failureKind,
      failedStage: "attributed-call",
      error,
    };
  }
  return {
    success: false,
    status: "fallback",
    originalCalldata,
    attributedCalldata,
    blockTag,
    originalReturnData,
    selectedCalldata: originalCalldata,
    failureKind,
    failedStage: "attributed-call",
    error,
  };
}

function blockedResult(
  originalCalldata: Hex,
  attributedCalldata: Hex,
  blockTag: Hex | null,
  failedStage: DryRunStage,
  failureKind: DryRunFailureKind,
  error: string,
  originalReturnData?: Hex,
  attributedReturnData?: Hex,
): DryRunResult {
  return {
    success: false,
    status: "blocked",
    originalCalldata,
    attributedCalldata,
    blockTag,
    selectedCalldata: null,
    failedStage,
    failureKind,
    error,
    ...(originalReturnData === undefined ? {} : { originalReturnData }),
    ...(attributedReturnData === undefined ? {} : { attributedReturnData }),
  };
}

type SimulationResult =
  | { readonly success: true; readonly returnData: Hex }
  | {
      readonly success: false;
      readonly failureKind: DryRunFailureKind;
      readonly error: string;
    };

async function simulateCall(
  client: JsonRpcClient,
  transaction: Record<string, Hex>,
  blockTag: Hex,
  request: DryRunRequest,
): Promise<SimulationResult> {
  try {
    const returnData = await requestHex(
      client,
      "eth_call",
      [transaction, blockTag],
      request,
    );
    assertHex(returnData, "eth_call result");
    return { success: true, returnData };
  } catch (error) {
    return {
      success: false,
      failureKind: classifyFailure(error),
      error: errorMessage(error),
    };
  }
}

async function requestHex(
  client: JsonRpcClient,
  method: string,
  params: readonly unknown[],
  request: DryRunRequest,
): Promise<Hex> {
  const result = await requestString(client, method, params, request);
  assertHex(result, `${method} result`);
  return result;
}

async function requestString(
  client: JsonRpcClient,
  method: string,
  params: readonly unknown[],
  request: DryRunRequest,
): Promise<Hex> {
  const result = await client.request<unknown>(method, params, {
    timeoutMs: request.timeoutMs,
    signal: request.signal,
  });
  if (typeof result !== "string") {
    throw new Error(`${method} result must be a hex string`);
  }
  return result as Hex;
}

function classifyFailure(error: unknown): DryRunFailureKind {
  if (!(error instanceof JsonRpcError)) return "invalid-result";
  if (
    error.kind === "rpc"
    && (error.code === 3 || /(?:execution\s+)?revert(?:ed)?\b/i.test(error.message))
  ) {
    return "execution-reverted";
  }
  return error.kind;
}

function assertFallbackPolicy(value: string): asserts value is FallbackPolicy {
  if (value !== "revert-only" && value !== "any-error" && value !== "never") {
    throw new Error("fallbackPolicy must be revert-only, any-error, or never");
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
