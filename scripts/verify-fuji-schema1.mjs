#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import {
  analyzeConfirmedTransaction,
  appendAttribution,
  JsonRpcClient,
  JsonRpcError,
  resolveCodeRegistry,
} from "../packages/sdk/dist/src/index.js";
import {
  createCheckRunner,
  equal,
  findHexData,
  verifyChainId,
  verifyLiveRuntime,
  verifyRebuiltRuntimes,
  verifyReceipt,
  verifySourceCommit,
  verifySourceTag,
} from "./lib/fuji-verification.mjs";

const rpcUrl = process.env.FUJI_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc";
const manifest = JSON.parse(
  await readFile(new URL("../deployments/fuji-schema1.json", import.meta.url)),
);
const client = new JsonRpcClient({ url: rpcUrl, timeoutMs: 15_000 });
const { check, failures } = createCheckRunner();

await check("source commit is available", async () => {
  verifySourceCommit(manifest);
});

await check("immutable source tag resolves to the recorded commit", async () => {
  verifySourceTag(manifest);
});

await check("source commit reproduces recorded runtime bytecode", async () => {
  await verifyRebuiltRuntimes(manifest, "avax-impact-schema1-source-");
});

await check("Fuji chain ID", async () => {
  await verifyChainId(client, manifest);
});

for (const [name, address] of Object.entries(manifest.contracts)) {
  await check(`${name} runtime bytecode`, async () => {
    await verifyLiveRuntime(client, manifest, name, address);
  });
}

const recordedTransactions = [
  ...manifest.transactions.deployments,
  { ...manifest.transactions.builderRegistration, contract: "BuilderRegistration" },
  { ...manifest.transactions.attributedPing, contract: "AttributedPing" },
];
for (const transaction of recordedTransactions) {
  await check(`${transaction.contract} receipt`, async () => {
    await verifyReceipt(client, transaction);
  });
}

await check("pinned ICodeRegistry record", async () => {
  const resolution = await resolveCodeRegistry({
    rpcUrl,
    registryAddress: manifest.contracts.builderRegistry,
    code: manifest.builder.code,
    timeoutMs: 15_000,
  });
  if (resolution.status !== "registered") throw new Error("builder is not registered");
  equal(resolution.record.valid, true, "code validity");
  equal(
    resolution.record.payoutAddress.toLowerCase(),
    manifest.builder.payoutAddress.toLowerCase(),
    "payout address",
  );
  equal(resolution.record.codeURI, manifest.builder.codeURI, "code URI");
});

await check("confirmed schema 1 attributed ping", async () => {
  const analysis = await analyzeConfirmedTransaction({
    rpcUrl,
    transactionHash: manifest.transactions.attributedPing.hash,
    expectedChainId: manifest.chainId,
    timeoutMs: 15_000,
  });
  equal(
    analysis.transaction.to?.toLowerCase(),
    manifest.contracts.attributionDemo.toLowerCase(),
    "transaction target",
  );
  if (analysis.attribution.status !== "declared") {
    throw new Error(`expected declared attribution, got ${analysis.attribution.status}`);
  }
  const declaration = analysis.attribution.declaration;
  equal(declaration.schemaId, 1, "schema ID");
  equal(declaration.codes.join(","), manifest.builder.code, "builder code");
  equal(
    declaration.registryAddress?.toLowerCase(),
    manifest.contracts.builderRegistry.toLowerCase(),
    "registry address",
  );
  equal(declaration.registryChainId, BigInt(manifest.chainId), "registry chain ID");
  equal(
    declaration.originalCalldata,
    "0x773acdef0000000000000000000000000000000000000000000000000000000000000029",
    "original ping(41) calldata",
  );
});

await check("schema 1 strict-calldata negative path", async () => {
  const originalCalldata =
    "0x56a316bb0000000000000000000000000000000000000000000000000000000000000029";
  const originalResult = await client.request(
    "eth_call",
    [{ to: manifest.contracts.strictCalldataDemo, data: originalCalldata }, "latest"],
  );
  equal(originalResult, "0x", "strictPing(41) original call result");

  const attributedCalldata = appendAttribution(originalCalldata, {
    registryAddress: manifest.contracts.builderRegistry,
    registryChainId: BigInt(manifest.chainId),
    codes: [manifest.builder.code],
  });
  try {
    await client.request(
      "eth_call",
      [{ to: manifest.contracts.strictCalldataDemo, data: attributedCalldata }, "latest"],
    );
    throw new Error("schema 1 strictPing(41) unexpectedly succeeded");
  } catch (error) {
    if (!(error instanceof JsonRpcError) || error.kind !== "rpc") throw error;
    const revertData = findHexData(error.data);
    if (revertData === undefined) throw new Error("strict revert did not include data");
    if (!revertData.toLowerCase().startsWith("0x7dc63f65")) {
      throw new Error(`unexpected strict revert selector: ${revertData.slice(0, 10)}`);
    }
    if (!revertData.toLowerCase().endsWith("58".padStart(64, "0"))) {
      throw new Error("strict revert did not report 88-byte schema 1 calldata");
    }
  }
});

if (failures.length > 0) {
  console.error(`\nFuji schema 1 verification failed (${failures.length} check(s)):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    "\nFuji schema 1 verification passed: source, bytecode, receipts, registry, attribution, and strict negative path agree.",
  );
}
