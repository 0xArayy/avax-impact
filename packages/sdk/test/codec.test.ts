import assert from "node:assert/strict";
import test from "node:test";

import {
  appendAttribution,
  CONFORMANCE_VECTORS,
  decodeAttribution,
  detectAttribution,
  encodeAttribution,
  ERC_8021_MARKER,
  stripAttribution,
  tryDecodeAttribution,
  validateBuilderCode,
} from "../src/index.js";
import {
  appendLegacyAttribution,
  encodeLegacyAttribution,
} from "../src/legacy.js";
import type { Hex } from "../src/index.js";

const normalCalldata: Hex =
  "0x773acdef0000000000000000000000000000000000000000000000000000000000000029";

test("encodes an ERC-8021-compatible schema-zero suffix", () => {
  const suffix = encodeLegacyAttribution(["avax-impact"]);
  assert.equal(
    suffix,
    `0x617661782d696d706163740b00${ERC_8021_MARKER.slice(2)}`,
  );
});

test("round-trips one builder code without changing original calldata", () => {
  const attributed = appendLegacyAttribution(normalCalldata, ["avax-impact"]);
  const decoded = decodeAttribution(attributed);

  assert.equal(decoded.schemaId, 0);
  assert.deepEqual(decoded.codes, ["avax-impact"]);
  assert.equal(decoded.originalCalldata, normalCalldata);
  assert.equal(stripAttribution(attributed), normalCalldata);
  assert.equal(decoded.suffixLengthBytes, 29);
});

test("round-trips multiple builder codes", () => {
  const attributed = appendLegacyAttribution(normalCalldata, ["wallet", "avax-impact"]);
  assert.deepEqual(decodeAttribution(attributed).codes, ["wallet", "avax-impact"]);
});

test("matches and round-trips the pinned ERC-8021 schema-one example", () => {
  const registryAddress = "0xcccccccccccccccccccccccccccccccccccccccc" as Hex;
  const suffix = encodeAttribution({
    registryAddress,
    registryChainId: 8453n,
    codes: ["baseapp", "morpho"],
  });
  assert.equal(
    suffix,
    `0x${"cc".repeat(20)}210502626173656170702c6d6f7270686f0e01${ERC_8021_MARKER.slice(2)}`,
  );

  const decoded = decodeAttribution(
    appendAttribution("0xdddddddd", {
      registryAddress,
      registryChainId: 8453n,
      codes: ["baseapp", "morpho"],
    }),
  );
  assert.equal(decoded.schemaId, 1);
  assert.equal(decoded.originalCalldata, "0xdddddddd");
  assert.deepEqual(decoded.codes, ["baseapp", "morpho"]);
  assert.equal(decoded.registryAddress, registryAddress);
  assert.equal(decoded.registryChainId, 8453n);
});

test("validates schema-one registry context", () => {
  const base = {
    registryAddress: "0x1111111111111111111111111111111111111111" as Hex,
    registryChainId: 43113n,
    codes: ["avax-impact"],
  };
  assert.throws(
    () => encodeAttribution({ ...base, registryAddress: `0x${"00".repeat(20)}` }),
    /zero address/,
  );
  assert.throws(() => encodeAttribution({ ...base, registryChainId: 0n }), /positive/);
  assert.throws(() => encodeAttribution({ ...base, registryChainId: 1n << 2040n }), /255 bytes/);
});

test("passes every published conformance vector", () => {
  for (const vector of CONFORMANCE_VECTORS) {
    if (vector.outcome.status === "unattributed") {
      assert.equal(detectAttribution(vector.calldata), false, vector.name);
      continue;
    }
    if (vector.outcome.status === "malformed") {
      assert.throws(
        () => decodeAttribution(vector.calldata),
        new RegExp(vector.outcome.errorIncludes),
        vector.name,
      );
      continue;
    }
    const decoded = decodeAttribution(vector.calldata);
    assert.equal(decoded.schemaId, vector.outcome.schemaId, vector.name);
    assert.deepEqual(decoded.codes, vector.outcome.codes, vector.name);
    assert.equal(decoded.originalCalldata, vector.outcome.originalCalldata, vector.name);
    assert.equal(decoded.registryAddress, vector.outcome.registryAddress, vector.name);
    assert.equal(decoded.registryChainId, vector.outcome.registryChainId, vector.name);
  }
});

test("detects only calldata ending in the marker", () => {
  assert.equal(detectAttribution(normalCalldata), false);
  assert.equal(detectAttribution(appendLegacyAttribution(normalCalldata, ["avax-impact"])), true);
});

test("returns null for unattributed or malformed calldata", () => {
  assert.equal(tryDecodeAttribution(normalCalldata), null);
  const malformed = `0x${"ff".repeat(20)}${ERC_8021_MARKER.slice(2)}` as Hex;
  assert.equal(tryDecodeAttribution(malformed), null);
});

test("separates registry policy from ERC-8021 wire-code validity", () => {
  assert.equal(validateBuilderCode("avax-impact").valid, true);
  assert.equal(validateBuilderCode("UPPERCASE").valid, false);
  assert.equal(validateBuilderCode("double--hyphen").valid, false);
  assert.deepEqual(decodeAttribution(appendLegacyAttribution("0x", ["A", "A"])).codes, ["A", "A"]);
  assert.throws(() => encodeLegacyAttribution([""]), /must not be empty/);
  assert.throws(() => encodeLegacyAttribution(["has,comma"]), /must not contain commas/);
  assert.throws(() => encodeLegacyAttribution(["avalanche-雪"]), /7-bit ASCII/);
  assert.throws(() => encodeLegacyAttribution(["a".repeat(256)]), /must not exceed 255 bytes/);
});

test("rejects unsupported schema IDs", () => {
  const valid = encodeLegacyAttribution(["avax-impact"]);
  const schemaIdOffset = valid.length - ERC_8021_MARKER.length;
  const unsupported = `${valid.slice(0, schemaIdOffset)}02${valid.slice(schemaIdOffset + 2)}` as Hex;
  assert.throws(() => decodeAttribution(unsupported), /unsupported attribution schema: 2/);
});

test("rejects invalid hex input", () => {
  assert.throws(
    () => appendLegacyAttribution("0x123" as Hex, ["avax-impact"]),
    /even number/,
  );
  assert.throws(
    () => decodeAttribution("0xnothex" as Hex),
    /non-hexadecimal/,
  );
});
