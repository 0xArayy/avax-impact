import assert from "node:assert/strict";
import test from "node:test";

import {
  appendAttribution,
  decodeAttribution,
  detectAttribution,
  encodeAttribution,
  ERC_8021_MARKER,
  stripAttribution,
  tryDecodeAttribution,
  validateBuilderCode,
} from "../src/index.js";
import type { Hex } from "../src/index.js";

const normalCalldata: Hex =
  "0x773acdef0000000000000000000000000000000000000000000000000000000000000029";

test("encodes an ERC-8021-compatible schema-zero suffix", () => {
  const suffix = encodeAttribution(["avax-impact"]);
  assert.equal(
    suffix,
    `0x617661782d696d706163740b00${ERC_8021_MARKER.slice(2)}`,
  );
});

test("round-trips one builder code without changing original calldata", () => {
  const attributed = appendAttribution(normalCalldata, ["avax-impact"]);
  const decoded = decodeAttribution(attributed);

  assert.equal(decoded.schemaId, 0);
  assert.deepEqual(decoded.codes, ["avax-impact"]);
  assert.equal(decoded.originalCalldata, normalCalldata);
  assert.equal(stripAttribution(attributed), normalCalldata);
  assert.equal(decoded.suffixLengthBytes, 29);
});

test("round-trips multiple builder codes", () => {
  const attributed = appendAttribution(normalCalldata, ["wallet", "avax-impact"]);
  assert.deepEqual(decodeAttribution(attributed).codes, ["wallet", "avax-impact"]);
});

test("detects only calldata ending in the marker", () => {
  assert.equal(detectAttribution(normalCalldata), false);
  assert.equal(detectAttribution(appendAttribution(normalCalldata, ["avax-impact"])), true);
});

test("returns null for unattributed or malformed calldata", () => {
  assert.equal(tryDecodeAttribution(normalCalldata), null);
  const malformed = `0x${"ff".repeat(20)}${ERC_8021_MARKER.slice(2)}` as Hex;
  assert.equal(tryDecodeAttribution(malformed), null);
});

test("rejects invalid builder codes", () => {
  assert.equal(validateBuilderCode("avax-impact").valid, true);
  assert.equal(validateBuilderCode("UPPERCASE").valid, false);
  assert.equal(validateBuilderCode("double--hyphen").valid, false);
  assert.throws(() => encodeAttribution(["ab"]), /between 3 and 32 bytes/);
  assert.throws(() => encodeAttribution(["same", "same"]), /duplicates/);
});

test("rejects unsupported schema IDs", () => {
  const valid = encodeAttribution(["avax-impact"]);
  const schemaIdOffset = valid.length - ERC_8021_MARKER.length;
  const unsupported = `${valid.slice(0, schemaIdOffset)}01${valid.slice(schemaIdOffset + 2)}` as Hex;
  assert.throws(() => decodeAttribution(unsupported), /unsupported attribution schema: 1/);
});

test("rejects invalid hex input", () => {
  assert.throws(
    () => appendAttribution("0x123" as Hex, ["avax-impact"]),
    /even number/,
  );
  assert.throws(
    () => decodeAttribution("0xnothex" as Hex),
    /non-hexadecimal/,
  );
});
