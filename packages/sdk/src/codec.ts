import { ERC_8021_MARKER, SCHEMA_ID } from "./constants.js";
import { assertHex, bytesToHex, concatBytes, hexToBytes } from "./hex.js";
import type { AttributionResult, Hex } from "./types.js";
import { assertValidBuilderCodes } from "./validation.js";

const markerBytes = hexToBytes(ERC_8021_MARKER);
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

export function encodeAttribution(codes: readonly string[]): Hex {
  assertValidBuilderCodes(codes);
  const encodedCodes = textEncoder.encode(codes.join(","));
  const suffix = concatBytes(
    encodedCodes,
    Uint8Array.of(encodedCodes.length),
    Uint8Array.of(SCHEMA_ID),
    markerBytes,
  );
  return bytesToHex(suffix);
}

export function appendAttribution(calldata: Hex, codes: readonly string[]): Hex {
  assertHex(calldata, "calldata");
  return bytesToHex(concatBytes(hexToBytes(calldata), hexToBytes(encodeAttribution(codes))));
}

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
  if (schemaId !== SCHEMA_ID) {
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
  assertValidBuilderCodes(codes);
  const suffixBytes = bytes.slice(codesStart);

  return {
    schemaId,
    codes,
    originalCalldata: bytesToHex(bytes.slice(0, codesStart)),
    suffix: bytesToHex(suffixBytes),
    suffixLengthBytes: suffixBytes.length,
  };
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
