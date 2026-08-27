import { appendAttribution, appendAttributionV1 } from "./codec.js";
import { assertAddress, assertHex, assertRpcQuantity } from "./hex.js";
import { JsonRpcClient } from "./rpc.js";
import type { DryRunRequest, DryRunResult, Hex } from "./types.js";

export async function prepareAttributedCall(request: DryRunRequest): Promise<DryRunResult> {
  assertAddress(request.to, "to");
  assertHex(request.calldata, "calldata");
  if (request.from !== undefined) assertAddress(request.from, "from");
  if (request.value !== undefined) assertRpcQuantity(request.value, "value");

  if ((request.registryAddress === undefined) !== (request.registryChainId === undefined)) {
    throw new Error("registryAddress and registryChainId must be provided together");
  }

  const attributedCalldata =
    request.registryAddress === undefined || request.registryChainId === undefined
      ? appendAttribution(request.calldata, request.codes)
      : appendAttributionV1(request.calldata, {
          registryAddress: request.registryAddress,
          registryChainId: request.registryChainId,
          codes: request.codes,
        });
  const transaction: Record<string, Hex> = {
    to: request.to,
    data: attributedCalldata,
  };
  if (request.from !== undefined) transaction.from = request.from;
  if (request.value !== undefined) transaction.value = request.value;

  try {
    const client = new JsonRpcClient({
      url: request.rpcUrl,
      timeoutMs: request.timeoutMs,
    });
    const result = await client.request<unknown>(
      "eth_call",
      [transaction, "latest"],
      { timeoutMs: request.timeoutMs, signal: request.signal },
    );
    if (typeof result !== "string") {
      return fallbackResult(request.calldata, attributedCalldata, "RPC response has no result");
    }
    assertHex(result, "eth_call result");
    return {
      success: true,
      originalCalldata: request.calldata,
      attributedCalldata,
      selectedCalldata: attributedCalldata,
      returnData: result,
    };
  } catch (error) {
    return fallbackResult(request.calldata, attributedCalldata, errorMessage(error));
  }
}

function fallbackResult(
  originalCalldata: Hex,
  attributedCalldata: Hex,
  error: string,
): DryRunResult {
  return {
    success: false,
    originalCalldata,
    attributedCalldata,
    selectedCalldata: originalCalldata,
    error,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
