import { appendAttribution } from "./codec.js";
import { assertAddress, assertHex, assertRpcQuantity } from "./hex.js";
import type { DryRunRequest, DryRunResult, Hex } from "./types.js";

interface JsonRpcResponse {
  readonly result?: string;
  readonly error?: {
    readonly code?: number;
    readonly message?: string;
    readonly data?: unknown;
  };
}

export async function prepareAttributedCall(request: DryRunRequest): Promise<DryRunResult> {
  assertAddress(request.to, "to");
  assertHex(request.calldata, "calldata");
  if (request.from !== undefined) assertAddress(request.from, "from");
  if (request.value !== undefined) assertRpcQuantity(request.value, "value");

  const attributedCalldata = appendAttribution(request.calldata, request.codes);
  const transaction: Record<string, Hex> = {
    to: request.to,
    data: attributedCalldata,
  };
  if (request.from !== undefined) transaction.from = request.from;
  if (request.value !== undefined) transaction.value = request.value;

  try {
    const response = await fetch(request.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [transaction, "latest"],
      }),
    });

    if (!response.ok) {
      return fallbackResult(
        request.calldata,
        attributedCalldata,
        `RPC returned HTTP ${response.status}`,
      );
    }

    const payload = (await response.json()) as JsonRpcResponse;
    if (payload.error !== undefined) {
      return fallbackResult(
        request.calldata,
        attributedCalldata,
        payload.error.message ?? `RPC error ${payload.error.code ?? "unknown"}`,
      );
    }
    if (typeof payload.result !== "string") {
      return fallbackResult(request.calldata, attributedCalldata, "RPC response has no result");
    }

    assertHex(payload.result, "eth_call result");
    return {
      success: true,
      originalCalldata: request.calldata,
      attributedCalldata,
      selectedCalldata: attributedCalldata,
      returnData: payload.result,
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
