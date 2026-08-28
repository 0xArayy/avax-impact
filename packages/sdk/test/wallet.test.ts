import assert from "node:assert/strict";
import test from "node:test";

import {
  createDataSuffixCapability,
  decodeAttribution,
} from "../src/index.js";
import type { Hex } from "../src/index.js";

test("creates a required ERC-5792 dataSuffix capability", () => {
  const capability = createDataSuffixCapability({
    codes: ["avax-impact"],
    registryAddress: "0x1111111111111111111111111111111111111111",
    registryChainId: 43113n,
  });
  assert.equal(capability.dataSuffix.optional, false);
  const declaration = decodeAttribution(`0x1234${capability.dataSuffix.value.slice(2)}` as Hex);
  assert.equal(declaration.schemaId, 1);
  assert.deepEqual(declaration.codes, ["avax-impact"]);
});

test("encodes schema-one registry context for wallet_sendCalls", () => {
  const capability = createDataSuffixCapability({
    codes: ["avax-impact", "partner"],
    registryAddress: "0x1111111111111111111111111111111111111111",
    registryChainId: 43113n,
    optional: true,
  });
  assert.equal(capability.dataSuffix.optional, true);
  const declaration = decodeAttribution(`0x${capability.dataSuffix.value.slice(2)}` as Hex);
  assert.equal(declaration.schemaId, 1);
  assert.equal(declaration.registryChainId, 43113n);
  assert.deepEqual(declaration.codes, ["avax-impact", "partner"]);
});
