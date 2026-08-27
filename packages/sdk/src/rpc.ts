import type {
  RpcClientOptions,
  RpcErrorKind,
  RpcRequestOptions,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 10_000;

export class JsonRpcError extends Error {
  readonly kind: RpcErrorKind;
  readonly code?: number;
  readonly data?: unknown;
  readonly httpStatus?: number;

  constructor(
    kind: RpcErrorKind,
    message: string,
    details: { code?: number; data?: unknown; httpStatus?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: details.cause });
    this.name = "JsonRpcError";
    this.kind = kind;
    this.code = details.code;
    this.data = details.data;
    this.httpStatus = details.httpStatus;
  }
}

export class JsonRpcClient {
  readonly url: string;
  readonly timeoutMs: number;
  readonly fetchImplementation: typeof globalThis.fetch;
  #nextId = 1;

  constructor(options: RpcClientOptions | string) {
    const normalized = typeof options === "string" ? { url: options } : options;
    if (normalized.url.length === 0) throw new Error("RPC URL must not be empty");
    this.url = normalized.url;
    this.timeoutMs = validateTimeout(normalized.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    this.fetchImplementation = normalized.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(
    method: string,
    params: readonly unknown[] = [],
    options: RpcRequestOptions = {},
  ): Promise<T> {
    if (method.length === 0) throw new Error("RPC method must not be empty");
    const id = this.#nextId++;
    const timeoutMs = validateTimeout(options.timeoutMs ?? this.timeoutMs);
    const controller = new AbortController();
    let timedOut = false;
    const abortFromCaller = (): void => controller.abort(options.signal?.reason);
    if (options.signal?.aborted) abortFromCaller();
    else options.signal?.addEventListener("abort", abortFromCaller, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error(`RPC request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      let response: Response;
      try {
        response = await this.fetchImplementation(this.url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
          signal: controller.signal,
        });
      } catch (error) {
        if (timedOut) {
          throw new JsonRpcError("timeout", `RPC request timed out after ${timeoutMs}ms`, {
            cause: error,
          });
        }
        if (options.signal?.aborted) {
          throw new JsonRpcError("aborted", "RPC request was aborted", { cause: error });
        }
        throw new JsonRpcError("transport", errorMessage(error), { cause: error });
      }

      if (!response.ok) {
        throw new JsonRpcError("http", `RPC returned HTTP ${response.status}`, {
          httpStatus: response.status,
        });
      }

      let payload: unknown;
      try {
        payload = JSON.parse(await response.text());
      } catch (error) {
        throw new JsonRpcError("malformed", "RPC response is not valid JSON", { cause: error });
      }
      if (!isRecord(payload) || payload.jsonrpc !== "2.0" || payload.id !== id) {
        throw new JsonRpcError("malformed", "RPC response has an invalid JSON-RPC envelope");
      }
      const hasResult = Object.hasOwn(payload, "result");
      const hasError = Object.hasOwn(payload, "error");
      if (hasResult === hasError) {
        throw new JsonRpcError(
          "malformed",
          "RPC response must contain exactly one of result or error",
        );
      }
      if (hasError) {
        const rpcError = payload.error;
        if (!isRecord(rpcError) || typeof rpcError.message !== "string") {
          throw new JsonRpcError("malformed", "RPC error object is malformed");
        }
        throw new JsonRpcError("rpc", rpcError.message, {
          code: typeof rpcError.code === "number" ? rpcError.code : undefined,
          data: rpcError.data,
        });
      }
      return payload.result as T;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abortFromCaller);
    }
  }
}

function validateTimeout(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("timeoutMs must be a positive safe integer");
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
