import type { Hex } from "./types.js";

export function assertHex(value: string, label = "value"): asserts value is Hex {
  if (!value.startsWith("0x")) {
    throw new Error(`${label} must start with 0x`);
  }

  const body = value.slice(2);
  if (body.length % 2 !== 0) {
    throw new Error(`${label} must contain an even number of hexadecimal characters`);
  }
  if (!/^[0-9a-fA-F]*$/.test(body)) {
    throw new Error(`${label} contains non-hexadecimal characters`);
  }
}

export function assertAddress(value: string, label = "address"): asserts value is Hex {
  assertHex(value, label);
  if (value.length !== 42) {
    throw new Error(`${label} must contain exactly 20 bytes`);
  }
}

export function assertRpcQuantity(value: string, label = "quantity"): asserts value is Hex {
  if (!/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value)) {
    throw new Error(`${label} must be a canonical non-negative JSON-RPC quantity`);
  }
}

export function hexToBytes(value: Hex): Uint8Array {
  assertHex(value);
  const body = value.slice(2);
  const bytes = new Uint8Array(body.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(body.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): Hex {
  let body = "";
  for (const byte of bytes) {
    body += byte.toString(16).padStart(2, "0");
  }
  return `0x${body}`;
}

export function concatBytes(...values: readonly Uint8Array[]): Uint8Array {
  const length = values.reduce((total, value) => total + value.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const value of values) {
    result.set(value, offset);
    offset += value.length;
  }
  return result;
}
