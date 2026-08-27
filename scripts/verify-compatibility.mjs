#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import { JsonRpcClient, prepareAttributedCall } from "../packages/sdk/dist/src/index.js";

const rpcUrl = process.env.FUJI_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc";
const corpus = JSON.parse(
  await readFile(new URL("../fixtures/compatibility-corpus.json", import.meta.url), "utf8"),
);
const client = new JsonRpcClient({ url: rpcUrl, timeoutMs: 15_000 });
const failures = [];
const results = [];

const chainId = await client.request("eth_chainId");
if (Number(BigInt(chainId)) !== corpus.chainId) {
  throw new Error(`expected chain ${corpus.chainId}, received ${Number(BigInt(chainId))}`);
}

for (const entry of corpus.cases) {
  try {
    const result = await prepareAttributedCall({
      rpcUrl,
      to: entry.target,
      calldata: entry.calldata,
      codes: entry.codes,
      value: "0x0",
      timeoutMs: 15_000,
    });

    equal(result.status, entry.expected.status, `${entry.id} status`);
    if ("compatibilityEvidence" in entry.expected) {
      equal(
        result.status === "attributed" ? result.compatibilityEvidence : undefined,
        entry.expected.compatibilityEvidence,
        `${entry.id} evidence`,
      );
      equal(
        result.status === "attributed" ? result.originalReturnData : undefined,
        result.status === "attributed" ? result.attributedReturnData : undefined,
        `${entry.id} return data`,
      );
    }
    if ("failureKind" in entry.expected) {
      equal(
        result.status === "attributed" ? undefined : result.failureKind,
        entry.expected.failureKind,
        `${entry.id} failure kind`,
      );
    }

    results.push({
      id: entry.id,
      classification: entry.classification,
      status: result.status,
      blockTag: result.blockTag,
      compatibilityEvidence:
        result.status === "attributed" ? result.compatibilityEvidence : undefined,
      failureKind: result.status === "attributed" ? undefined : result.failureKind,
    });
    console.log(`PASS ${entry.id} at ${result.blockTag}: ${result.status}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${entry.id}: ${message}`);
    console.error(`FAIL ${entry.id}: ${message}`);
  }
}

console.log(JSON.stringify({ corpusVersion: corpus.version, chainId: corpus.chainId, results }, null, 2));

if (failures.length > 0) {
  console.error(`Compatibility verification failed (${failures.length} case(s)):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    "Compatibility corpus passed. These first-party cases are regression evidence, not external adoption evidence.",
  );
}

function equal(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected}, received ${actual}`);
  }
}
