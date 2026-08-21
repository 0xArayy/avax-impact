export type Hex = `0x${string}`;

export interface AttributionResult {
  readonly schemaId: number;
  readonly codes: readonly string[];
  readonly originalCalldata: Hex;
  readonly suffix: Hex;
  readonly suffixLengthBytes: number;
}

const ERC_8021_MARKER = "0x80218021802180218021802180218021" as const;
const SCHEMA_ID = 0;
const markerBytes = hexToBytes(ERC_8021_MARKER);
const textDecoder = new TextDecoder("utf-8", { fatal: true });
const builderCodePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertHex(value: string, label = "value"): asserts value is Hex {
  if (!value.startsWith("0x")) {
    throw new Error(`${label} must start with 0x`);
  }

  const body = value.slice(2);
  if (body.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(body)) {
    throw new Error(`${label} must contain complete hexadecimal bytes`);
  }
}

function hexToBytes(value: Hex): Uint8Array {
  assertHex(value);
  const body = value.slice(2);
  const bytes = new Uint8Array(body.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(body.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): Hex {
  let body = "";
  for (const byte of bytes) body += byte.toString(16).padStart(2, "0");
  return `0x${body}`;
}

function validateCodes(codes: readonly string[]): void {
  if (codes.length === 0 || codes.length > 4) {
    throw new Error("attribution must contain between one and four builder codes");
  }

  for (const code of codes) {
    const length = new TextEncoder().encode(code).length;
    if (length < 3 || length > 32 || !builderCodePattern.test(code)) {
      throw new Error(`invalid builder code: ${code}`);
    }
  }
}

export function decodeAttribution(calldata: string): AttributionResult {
  assertHex(calldata, "calldata");
  const bytes = hexToBytes(calldata);

  if (bytes.length < markerBytes.length + 2) {
    throw new Error("No ERC-8021 attribution suffix found");
  }

  const markerOffset = bytes.length - markerBytes.length;
  for (let index = 0; index < markerBytes.length; index += 1) {
    if (bytes[markerOffset + index] !== markerBytes[index]) {
      throw new Error("No ERC-8021 attribution suffix found");
    }
  }

  const schemaIdIndex = markerOffset - 1;
  const codesLengthIndex = schemaIdIndex - 1;
  const schemaId = bytes[schemaIdIndex];
  if (schemaId !== SCHEMA_ID) {
    throw new Error(`Unsupported attribution schema: ${schemaId}`);
  }

  const codesLength = bytes[codesLengthIndex];
  if (codesLength === 0) throw new Error("Builder-code payload is empty");

  const codesStart = codesLengthIndex - codesLength;
  if (codesStart < 0) throw new Error("Attribution suffix is truncated");

  let encodedCodes: string;
  try {
    encodedCodes = textDecoder.decode(bytes.slice(codesStart, codesLengthIndex));
  } catch {
    throw new Error("Builder-code payload is not valid UTF-8");
  }

  const codes = encodedCodes.split(",");
  validateCodes(codes);
  const suffix = bytes.slice(codesStart);

  return {
    schemaId,
    codes,
    originalCalldata: bytesToHex(bytes.slice(0, codesStart)),
    suffix: bytesToHex(suffix),
    suffixLengthBytes: suffix.length,
  };
}
