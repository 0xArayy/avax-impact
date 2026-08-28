import { ERC_8021_MARKER, SCHEMA_ID, SCHEMA_ID_V1 } from "./constants.js";
import { assertAddress, assertHex, bytesToHex, concatBytes, hexToBytes } from "./hex.js";
import type { AttributionResult, Hex, Schema1Attribution } from "./types.js";

const markerBytes = hexToBytes(ERC_8021_MARKER);
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export function encodeLegacyAttribution(codes: readonly string[]): Hex {
  assertWireCodes(codes);
  const encodedCodes = textEncoder.encode(codes.join(","));
  const suffix = concatBytes(
    encodedCodes,
    Uint8Array.of(encodedCodes.length),
    Uint8Array.of(SCHEMA_ID),
    markerBytes,
  );
  return bytesToHex(suffix);
}

export function appendLegacyAttribution(calldata: Hex, codes: readonly string[]): Hex {
  assertHex(calldata, "calldata");
  return bytesToHex(
    concatBytes(hexToBytes(calldata), hexToBytes(encodeLegacyAttribution(codes))),
  );
}

export function encodeAttribution(attribution: Schema1Attribution): Hex {
  assertAddress(attribution.registryAddress, "registryAddress");
  if (/^0x0{40}$/i.test(attribution.registryAddress)) {
    throw new Error("registryAddress must not be the zero address");
  }
  assertWireCodes(attribution.codes);
  const chainId = encodeMinimalChainId(attribution.registryChainId);
  const encodedCodes = textEncoder.encode(attribution.codes.join(","));
  return bytesToHex(
    concatBytes(
      hexToBytes(attribution.registryAddress),
      chainId,
      Uint8Array.of(chainId.length),
      encodedCodes,
      Uint8Array.of(encodedCodes.length),
      Uint8Array.of(SCHEMA_ID_V1),
      markerBytes,
    ),
  );
}

export function appendAttribution(calldata: Hex, attribution: Schema1Attribution): Hex {
  assertHex(calldata, "calldata");
  return bytesToHex(
    concatBytes(hexToBytes(calldata), hexToBytes(encodeAttribution(attribution))),
  );
}

/** @deprecated Use `encodeAttribution`; schema 1 is the canonical public format. */
export const encodeAttributionV1 = encodeAttribution;

/** @deprecated Use `appendAttribution`; schema 1 is the canonical public format. */
export const appendAttributionV1 = appendAttribution;

export function detectAttribution(calldata: Hex): boolean {
  assertHex(calldata, "calldata");
  const bytes = hexToBytes(calldata);
  if (bytes.length < markerBytes.length + 2) return false;

  const markerOffset = bytes.length - markerBytes.length;
  for (let index = 0; index < markerBytes.length; index += 1) {
    if (bytes[markerOffset + index] !== markerBytes[index]) return false;
  }
  return true;
}

export function decodeAttribution(calldata: Hex): AttributionResult {
  assertHex(calldata, "calldata");
  if (!detectAttribution(calldata)) {
    throw new Error("calldata does not end with the ERC-8021 marker");
  }

  const bytes = hexToBytes(calldata);
  const schemaIdIndex = bytes.length - markerBytes.length - 1;
  const codesLengthIndex = schemaIdIndex - 1;
  if (codesLengthIndex < 0) {
    throw new Error("attribution suffix is truncated");
  }

  const schemaId = bytes[schemaIdIndex];
  if (schemaId !== SCHEMA_ID && schemaId !== SCHEMA_ID_V1) {
    throw new Error(`unsupported attribution schema: ${schemaId}`);
  }

  const codesLength = bytes[codesLengthIndex];
  if (codesLength === 0) {
    throw new Error("attribution suffix contains an empty builder-code payload");
  }

  const codesStart = codesLengthIndex - codesLength;
  if (codesStart < 0) {
    throw new Error("attribution suffix declares more builder-code bytes than calldata contains");
  }

  let encodedCodes: string;
  try {
    encodedCodes = textDecoder.decode(bytes.slice(codesStart, codesLengthIndex));
  } catch {
    throw new Error("attribution builder-code payload is not valid UTF-8");
  }

  const codes = encodedCodes.split(",");
  assertWireCodes(codes);
  let originalEnd = codesStart;
  let registryAddress: Hex | undefined;
  let registryChainId: bigint | undefined;
  if (schemaId === SCHEMA_ID_V1) {
    const chainIdLengthIndex = codesStart - 1;
    if (chainIdLengthIndex < 0) throw new Error("schema-1 attribution suffix is truncated");
    const chainIdLength = bytes[chainIdLengthIndex];
    if (chainIdLength === 0) throw new Error("schema-1 registry chain ID is empty");
    const chainIdStart = chainIdLengthIndex - chainIdLength;
    const registryStart = chainIdStart - 20;
    if (registryStart < 0) {
      throw new Error("schema-1 registry address or chain ID crosses calldata start");
    }
    const chainIdBytes = bytes.slice(chainIdStart, chainIdLengthIndex);
    const chainIdValue = bytesToBigInt(chainIdBytes);
    registryAddress = bytesToHex(bytes.slice(registryStart, chainIdStart));
    if (/^0x0{40}$/i.test(registryAddress)) {
      throw new Error("schema-1 registry address is the zero address");
    }
    if (chainIdValue === 0n) throw new Error("schema-1 registry chain ID must be positive");
    registryChainId = chainIdValue;
    originalEnd = registryStart;
  }
  const suffixBytes = bytes.slice(originalEnd);

  return {
    schemaId,
    codes,
    originalCalldata: bytesToHex(bytes.slice(0, originalEnd)),
    suffix: bytesToHex(suffixBytes),
    suffixLengthBytes: suffixBytes.length,
    ...(registryAddress === undefined ? {} : { registryAddress, registryChainId }),
  };
}

function encodeMinimalChainId(chainId: bigint): Uint8Array {
  if (chainId <= 0n) {
    throw new Error("registryChainId must be positive");
  }
  let hex = chainId.toString(16);
  if (hex.length % 2 !== 0) hex = `0${hex}`;
  const encoded = hexToBytes(`0x${hex}` as Hex);
  if (encoded.length > 255) {
    throw new Error("registryChainId must fit in 255 bytes");
  }
  return encoded;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const byte of bytes) result = (result << 8n) | BigInt(byte);
  return result;
}

/** ERC-8021 wire rules. Registry-specific format policy belongs in `isValidCode`. */
function assertWireCodes(codes: readonly string[]): void {
  if (codes.length === 0) throw new Error("at least one attribution code is required");
  for (const code of codes) {
    if (typeof code !== "string" || code.length === 0) {
      throw new Error("attribution codes must not be empty");
    }
    if (code.includes(",")) {
      throw new Error("attribution codes must not contain commas");
    }
    const bytes = textEncoder.encode(code);
    if (bytes.some((byte) => byte > 0x7f)) {
      throw new Error("attribution codes must contain only 7-bit ASCII");
    }
  }
  if (textEncoder.encode(codes.join(",")).length > 255) {
    throw new Error("encoded attribution codes must not exceed 255 bytes");
  }
}

export function tryDecodeAttribution(calldata: Hex): AttributionResult | null {
  try {
    return decodeAttribution(calldata);
  } catch {
    return null;
  }
}

export function stripAttribution(calldata: Hex): Hex {
  return decodeAttribution(calldata).originalCalldata;
}
