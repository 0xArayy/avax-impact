import { assertAddress, assertHex, bytesToHex, concatBytes, hexToBytes } from "./hex.js";
import { JsonRpcClient, JsonRpcError } from "./rpc.js";
import type {
  CodeRegistryResolution,
  Hex,
  LegacyBuilderRecord,
  LegacyBuilderResolution,
  ResolveBuilderRequest,
} from "./types.js";
import { assertValidBuilderCode } from "./validation.js";

const RESOLVE_SELECTOR: Hex = "0x461a4478";
const CODE_NOT_REGISTERED_SELECTOR = "0x0063d2c3";
const PAYOUT_ADDRESS_SELECTOR: Hex = "0xdfcde24b";
const CODE_URI_SELECTOR: Hex = "0xb2cbce0e";
const IS_VALID_CODE_SELECTOR: Hex = "0x25ed64a0";
const IS_REGISTERED_SELECTOR: Hex = "0xc822d7f0";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export async function resolveLegacyBuilder(
  request: ResolveBuilderRequest,
): Promise<LegacyBuilderResolution> {
  assertAddress(request.registryAddress, "registryAddress");
  assertValidBuilderCode(request.code);
  const blockTag = request.blockTag ?? "latest";
  if (blockTag.startsWith("0x")) assertHex(blockTag, "blockTag");
  const client = new JsonRpcClient({ url: request.rpcUrl, timeoutMs: request.timeoutMs });
  try {
    const result = await client.request<unknown>(
      "eth_call",
      [{ to: request.registryAddress, data: encodeResolveCall(request.code) }, blockTag],
      { timeoutMs: request.timeoutMs, signal: request.signal },
    );
    if (typeof result !== "string") throw new Error("resolve eth_call result must be a string");
    assertHex(result, "resolve eth_call result");
    const record = decodeBuilderRecord(result);
    if (record.code !== request.code) {
      throw new Error(`registry returned code ${JSON.stringify(record.code)} for ${request.code}`);
    }
    return {
      status: record.active ? "registered-active" : "registered-inactive",
      record,
    };
  } catch (error) {
    if (error instanceof JsonRpcError && error.kind === "rpc") {
      const revertData = findHexData(error.data);
      if (revertData?.toLowerCase().startsWith(CODE_NOT_REGISTERED_SELECTOR)) {
        return { status: "unregistered", code: request.code };
      }
    }
    throw error;
  }
}

/** Resolve the read-only ERC-8021 code-registry interface pinned by the SDK draft revision. */
export async function resolveCodeRegistry(
  request: ResolveBuilderRequest,
): Promise<CodeRegistryResolution> {
  assertAddress(request.registryAddress, "registryAddress");
  assertStandardCodeQuery(request.code);
  const blockTag = request.blockTag ?? "latest";
  if (blockTag.startsWith("0x")) assertHex(blockTag, "blockTag");
  const client = new JsonRpcClient({ url: request.rpcUrl, timeoutMs: request.timeoutMs });
  const rpcOptions = { timeoutMs: request.timeoutMs, signal: request.signal };
  const call = (selector: Hex): Promise<unknown> =>
    client.request(
      "eth_call",
      [{ to: request.registryAddress, data: encodeStringCall(selector, request.code) }, blockTag],
      rpcOptions,
    );
  const [registeredValue, validValue] = await Promise.all([
    call(IS_REGISTERED_SELECTOR),
    call(IS_VALID_CODE_SELECTOR),
  ]);
  const registered = decodeBoolResult(registeredValue, "isRegistered");
  const valid = decodeBoolResult(validValue, "isValidCode");
  if (!registered) return { status: "unregistered", code: request.code, valid };

  const [payoutValue, uriValue] = await Promise.all([
    call(PAYOUT_ADDRESS_SELECTOR),
    call(CODE_URI_SELECTOR),
  ]);
  const payoutAddress = decodeAddressResult(payoutValue, "payoutAddress");
  const codeURI = decodeStringResult(uriValue, "codeURI");
  return {
    status: "registered",
    record: { code: request.code, payoutAddress, codeURI, valid },
  };
}

function assertStandardCodeQuery(code: string): void {
  const encoded = textEncoder.encode(code);
  if (encoded.length === 0 || encoded.length > 255) {
    throw new Error("code must contain between 1 and 255 bytes");
  }
  if (code.includes(",")) throw new Error("code must not contain commas");
  if (encoded.some((byte) => byte > 0x7f)) {
    throw new Error("code must contain only 7-bit ASCII");
  }
}

export function encodeResolveCall(code: string): Hex {
  assertValidBuilderCode(code);
  const value = textEncoder.encode(code);
  return bytesToHex(
    concatBytes(
      hexToBytes(RESOLVE_SELECTOR),
      encodeWord(32n),
      encodeWord(BigInt(value.length)),
      padRight(value),
    ),
  );
}

function encodeStringCall(selector: Hex, value: string): Hex {
  const encoded = textEncoder.encode(value);
  return bytesToHex(
    concatBytes(
      hexToBytes(selector),
      encodeWord(32n),
      encodeWord(BigInt(encoded.length)),
      padRight(encoded),
    ),
  );
}

export function decodeBuilderRecord(value: Hex): LegacyBuilderRecord {
  assertHex(value, "encoded BuilderRecord");
  const bytes = hexToBytes(value);
  if (bytes.length < 32) throw new Error("encoded BuilderRecord is truncated");
  const tupleOffset = readSafeOffset(bytes, 0, "BuilderRecord tuple");
  const headLength = 6 * 32;
  if (tupleOffset + headLength > bytes.length) {
    throw new Error("encoded BuilderRecord tuple head is truncated");
  }

  const codeOffset = readSafeOffset(bytes, tupleOffset, "BuilderRecord code");
  const owner = readAddress(bytes, tupleOffset + 32, "BuilderRecord owner");
  const payoutAddress = readAddress(
    bytes,
    tupleOffset + 64,
    "BuilderRecord payoutAddress",
  );
  const metadataOffset = readSafeOffset(
    bytes,
    tupleOffset + 96,
    "BuilderRecord metadataURI",
  );
  const registeredAtValue = readWord(bytes, tupleOffset + 128);
  if (registeredAtValue > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("BuilderRecord registeredAt exceeds the safe integer range");
  }
  const activeValue = readWord(bytes, tupleOffset + 160);
  if (activeValue !== 0n && activeValue !== 1n) {
    throw new Error("BuilderRecord active is not a canonical ABI boolean");
  }

  return {
    code: readString(bytes, tupleOffset + codeOffset, "BuilderRecord code"),
    owner,
    payoutAddress,
    metadataURI: readString(
      bytes,
      tupleOffset + metadataOffset,
      "BuilderRecord metadataURI",
    ),
    registeredAt: Number(registeredAtValue),
    active: activeValue === 1n,
  };
}

function readString(bytes: Uint8Array, offset: number, label: string): string {
  if (offset + 32 > bytes.length) throw new Error(`${label} length is out of bounds`);
  const length = readSafeNumber(bytes, offset, `${label} length`);
  const start = offset + 32;
  if (start + length > bytes.length) throw new Error(`${label} data is out of bounds`);
  try {
    return textDecoder.decode(bytes.slice(start, start + length));
  } catch {
    throw new Error(`${label} is not valid UTF-8`);
  }
}

function readAddress(bytes: Uint8Array, offset: number, label: string): Hex {
  if (offset + 32 > bytes.length) throw new Error(`${label} is out of bounds`);
  if (bytes.slice(offset, offset + 12).some((byte) => byte !== 0)) {
    throw new Error(`${label} has non-zero ABI padding`);
  }
  return bytesToHex(bytes.slice(offset + 12, offset + 32));
}

function readSafeOffset(bytes: Uint8Array, offset: number, label: string): number {
  const value = readSafeNumber(bytes, offset, label);
  if (value % 32 !== 0) throw new Error(`${label} offset is not word-aligned`);
  return value;
}

function readSafeNumber(bytes: Uint8Array, offset: number, label: string): number {
  const value = readWord(bytes, offset);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds the safe integer range`);
  }
  return Number(value);
}

function readWord(bytes: Uint8Array, offset: number): bigint {
  if (offset + 32 > bytes.length) throw new Error("ABI word is out of bounds");
  return BigInt(bytesToHex(bytes.slice(offset, offset + 32)));
}

function encodeWord(value: bigint): Uint8Array {
  return hexToBytes(`0x${value.toString(16).padStart(64, "0")}` as Hex);
}

function padRight(value: Uint8Array): Uint8Array {
  const padded = new Uint8Array(Math.ceil(value.length / 32) * 32);
  padded.set(value);
  return padded;
}

function findHexData(value: unknown): string | undefined {
  if (typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value)) return value;
  if (typeof value !== "object" || value === null) return undefined;
  for (const nested of Object.values(value)) {
    const found = findHexData(nested);
    if (found !== undefined) return found;
  }
  return undefined;
}

function decodeBoolResult(value: unknown, label: string): boolean {
  const bytes = decodeRpcHex(value, label);
  if (bytes.length !== 32) throw new Error(`${label} result must contain one ABI word`);
  const decoded = readWord(bytes, 0);
  if (decoded !== 0n && decoded !== 1n) throw new Error(`${label} result is not a boolean`);
  return decoded === 1n;
}

function decodeAddressResult(value: unknown, label: string): Hex {
  const bytes = decodeRpcHex(value, label);
  if (bytes.length !== 32) throw new Error(`${label} result must contain one ABI word`);
  return readAddress(bytes, 0, `${label} result`);
}

function decodeStringResult(value: unknown, label: string): string {
  const bytes = decodeRpcHex(value, label);
  const offset = readSafeOffset(bytes, 0, `${label} result`);
  return readString(bytes, offset, `${label} result`);
}

function decodeRpcHex(value: unknown, label: string): Uint8Array {
  if (typeof value !== "string") throw new Error(`${label} result must be a string`);
  assertHex(value, `${label} result`);
  return hexToBytes(value);
}
