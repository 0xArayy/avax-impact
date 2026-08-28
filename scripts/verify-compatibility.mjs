#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import { JsonRpcClient, prepareAttributedCall } from "../packages/sdk/dist/src/index.js";

const corpus = JSON.parse(
  await readFile(new URL("../fixtures/compatibility-corpus.json", import.meta.url), "utf8"),
);
const failures = [];
const results = [];
const blockTags = {};
const rpcUrls = {
  fuji: process.env.FUJI_RPC_URL ?? corpus.networks.fuji.rpcUrl,
  "c-chain": process.env.AVALANCHE_RPC_URL ?? corpus.networks["c-chain"].rpcUrl,
};

await Promise.all(Object.entries(corpus.networks).map(async ([networkId, network]) => {
  const client = new JsonRpcClient({ url: rpcUrls[networkId], timeoutMs: 15_000 });
  const [chainId, blockTag] = await Promise.all([
    client.request("eth_chainId"),
    client.request("eth_blockNumber"),
  ]);
  if (Number(BigInt(chainId)) !== network.chainId) {
    throw new Error(
      `${networkId}: expected chain ${network.chainId}, received ${Number(BigInt(chainId))}`,
    );
  }
  blockTags[networkId] = blockTag;
}));

const concurrency = 3;
for (let offset = 0; offset < corpus.cases.length; offset += concurrency) {
  const batch = corpus.cases.slice(offset, offset + concurrency);
  const outcomes = await Promise.all(batch.map(async (entry) => {
    try {
      const result = await prepareAttributedCall({
        rpcUrl: rpcUrls[entry.network],
        to: entry.target,
        calldata: entry.calldata,
        codes: entry.codes,
        registryAddress: corpus.registry.address,
        registryChainId: BigInt(corpus.registry.chainId),
        blockTag: blockTags[entry.network],
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
      if ("failedStage" in entry.expected) {
        equal(
          result.status === "attributed" ? undefined : result.failedStage,
          entry.expected.failedStage,
          `${entry.id} failed stage`,
        );
      }

      return { entry, result, summary: {
        id: entry.id,
        protocol: entry.protocol,
        network: entry.network,
        classification: entry.classification,
        status: result.status,
        blockTag: result.blockTag,
        compatibilityEvidence:
          result.status === "attributed" ? result.compatibilityEvidence : undefined,
        failureKind: result.status === "attributed" ? undefined : result.failureKind,
        failedStage: result.status === "attributed" ? undefined : result.failedStage,
      } };
    } catch (error) {
      return {
        entry,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }));

  for (const outcome of outcomes) {
    if ("error" in outcome) {
      failures.push(`${outcome.entry.id}: ${outcome.error}`);
      console.error(`FAIL ${outcome.entry.id}: ${outcome.error}`);
    } else {
      results.push(outcome.summary);
      console.log(
        `PASS ${outcome.entry.id} at ${outcome.result.blockTag}: ${outcome.result.status}`,
      );
    }
  }
}

console.log(JSON.stringify({
  corpusVersion: corpus.version,
  registry: corpus.registry,
  networks: Object.fromEntries(
    Object.entries(corpus.networks).map(([id, network]) => [id, network.chainId]),
  ),
  results,
}, null, 2));

if (failures.length > 0) {
  console.error(`Compatibility verification failed (${failures.length} case(s)):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    "Compatibility corpus passed. External contract results are engineering evidence, not adoption evidence.",
  );
}

function equal(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected}, received ${actual}`);
  }
}
