import { decodeAttribution, detectAttribution } from "./codec.js";
import { assertAddress, assertHex, assertRpcQuantity } from "./hex.js";
import { JsonRpcClient } from "./rpc.js";
import type {
  Hex,
  RpcTransaction,
  TransactionAnalysis,
  TransactionFetchRequest,
} from "./types.js";

export class TransactionNotFoundError extends Error {
  readonly transactionHash: Hex;

  constructor(transactionHash: Hex) {
    super(`transaction not found: ${transactionHash}`);
    this.name = "TransactionNotFoundError";
    this.transactionHash = transactionHash;
  }
}

export async function fetchTransaction(
  request: TransactionFetchRequest,
): Promise<{ readonly chainId: number; readonly transaction: RpcTransaction }> {
  assertTransactionHash(request.transactionHash);
  const client = new JsonRpcClient({ url: request.rpcUrl, timeoutMs: request.timeoutMs });
  const rpcOptions = { timeoutMs: request.timeoutMs, signal: request.signal };
  const [chainIdValue, transactionValue] = await Promise.all([
    client.request<unknown>("eth_chainId", [], rpcOptions),
    client.request<unknown>(
      "eth_getTransactionByHash",
      [request.transactionHash],
      rpcOptions,
    ),
  ]);
  const chainId = parseChainId(chainIdValue);
  if (request.expectedChainId !== undefined && chainId !== request.expectedChainId) {
    throw new Error(
      `unexpected chain ID ${chainId}; expected ${request.expectedChainId}`,
    );
  }
  if (transactionValue === null) throw new TransactionNotFoundError(request.transactionHash);
  const transaction = parseTransaction(transactionValue);
  if (transaction.hash.toLowerCase() !== request.transactionHash.toLowerCase()) {
    throw new Error("RPC transaction hash does not match the requested hash");
  }
  return { chainId, transaction };
}

export async function analyzeTransaction(
  request: TransactionFetchRequest,
): Promise<TransactionAnalysis> {
  const fetched = await fetchTransaction(request);
  let attribution: TransactionAnalysis["attribution"];
  if (!detectAttribution(fetched.transaction.input)) {
    attribution = { status: "unattributed" };
  } else {
    try {
      attribution = {
        status: "declared",
        declaration: decodeAttribution(fetched.transaction.input),
      };
    } catch (error) {
      attribution = { status: "malformed", error: errorMessage(error) };
    }
  }
  return { ...fetched, attribution };
}

function parseChainId(value: unknown): number {
  if (typeof value !== "string") throw new Error("eth_chainId result must be a string");
  assertRpcQuantity(value, "eth_chainId result");
  const parsed = Number(BigInt(value));
  if (!Number.isSafeInteger(parsed)) throw new Error("chain ID exceeds the safe integer range");
  if (parsed <= 0) throw new Error("chain ID must be positive");
  return parsed;
}

function parseTransaction(value: unknown): RpcTransaction {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("transaction result must be an object");
  }
  const record = value as Record<string, unknown>;
  const input = requiredString(value, "input");
  const hash = requiredString(value, "hash");
  const from = requiredString(value, "from");
  const amount = requiredString(value, "value");
  assertHex(input, "transaction input");
  assertTransactionHash(hash);
  assertAddress(from, "transaction from");
  assertRpcQuantity(amount, "transaction value");

  const toValue = record.to;
  if (toValue !== null && typeof toValue !== "string") {
    throw new Error("transaction to must be an address or null");
  }
  if (toValue !== null) assertAddress(toValue, "transaction to");

  const blockNumberValue = record.blockNumber;
  if (blockNumberValue !== null && typeof blockNumberValue !== "string") {
    throw new Error("transaction blockNumber must be a quantity or null");
  }
  if (blockNumberValue !== null) {
    assertRpcQuantity(blockNumberValue, "transaction blockNumber");
  }
  return {
    hash,
    input,
    from,
    to: toValue,
    value: amount,
    blockNumber: blockNumberValue,
  };
}

function requiredString(value: object, key: string): string {
  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") throw new Error(`transaction ${key} must be a string`);
  return candidate;
}

function assertTransactionHash(value: string): asserts value is Hex {
  assertHex(value, "transaction hash");
  if (value.length !== 66) throw new Error("transaction hash must contain exactly 32 bytes");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
