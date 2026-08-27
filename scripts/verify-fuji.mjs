#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  analyzeTransaction,
  JsonRpcClient,
  JsonRpcError,
} from "../packages/sdk/dist/src/index.js";
import {
  appendLegacyAttribution,
  resolveLegacyBuilder,
} from "../packages/sdk/dist/src/legacy.js";

const rpcUrl = process.env.FUJI_RPC_URL ?? "https://api.avax-test.network/ext/bc/C/rpc";
const manifest = JSON.parse(await readFile(new URL("../deployments/fuji.json", import.meta.url)));
const client = new JsonRpcClient({ url: rpcUrl, timeoutMs: 15_000 });
const failures = [];

await check("source commit is available", async () => {
  execFileSync("git", ["cat-file", "-e", `${manifest.sourceCommit}^{commit}`], {
    stdio: "ignore",
  });
});

await check("durable source tag resolves to the recorded commit", async () => {
  const taggedCommit = execFileSync("git", ["rev-list", "-n", "1", manifest.sourceTag], {
    encoding: "utf8",
  }).trim();
  equal(taggedCommit, manifest.sourceCommit, "source tag commit");
});

await check("source commit reproduces recorded runtime bytecode", async () => {
  const sourceDirectory = await mkdtemp(join(tmpdir(), "avax-impact-source-"));
  const archivePath = `${sourceDirectory}.tar`;
  try {
    execFileSync(
      "git",
      ["archive", "--format=tar", "--output", archivePath, manifest.sourceCommit],
      { stdio: "ignore" },
    );
    execFileSync("tar", ["-xf", archivePath, "-C", sourceDirectory], { stdio: "ignore" });
    execFileSync("forge", ["build", "--offline", "--root", sourceDirectory], {
      stdio: "ignore",
    });

    const artifacts = {
      builderRegistry: "contracts/out/BuilderRegistry.sol/BuilderRegistry.json",
      attributionDemo: "contracts/out/AttributionDemo.sol/AttributionDemo.json",
      strictCalldataDemo: "contracts/out/AttributionDemo.sol/StrictCalldataDemo.json",
    };
    for (const [name, artifactPath] of Object.entries(artifacts)) {
      const artifact = JSON.parse(await readFile(join(sourceDirectory, artifactPath), "utf8"));
      const runtime = artifact.deployedBytecode?.object;
      if (typeof runtime !== "string" || !runtime.startsWith("0x")) {
        throw new Error(`${name} artifact has no runtime bytecode`);
      }
      equal((runtime.length - 2) / 2, manifest.runtimeBytecode[name].bytes, `${name} bytes`);
      equal(keccak(runtime), manifest.runtimeBytecode[name].keccak256, `${name} hash`);
    }
  } finally {
    await rm(sourceDirectory, { recursive: true, force: true });
    await rm(archivePath, { force: true });
  }
});

await check("Fuji chain ID", async () => {
  const chainId = await client.request("eth_chainId");
  equal(Number(BigInt(chainId)), manifest.chainId, "chain ID");
});

for (const [name, address] of Object.entries(manifest.contracts)) {
  await check(`${name} runtime bytecode`, async () => {
    const code = await client.request("eth_getCode", [address, "latest"]);
    if (typeof code !== "string" || code === "0x") throw new Error("contract has no code");
    const expected = manifest.runtimeBytecode[name];
    equal((code.length - 2) / 2, expected.bytes, "runtime byte length");
    equal(keccak(code), expected.keccak256, "runtime bytecode hash");
  });
}

const recordedTransactions = [
  ...manifest.transactions.deployments,
  { ...manifest.transactions.builderRegistration, contract: "builderRegistration" },
  { ...manifest.transactions.attributedPing, contract: "attributedPing" },
];
for (const transaction of recordedTransactions) {
  await check(`${transaction.contract} receipt`, async () => {
    const receipt = await client.request("eth_getTransactionReceipt", [transaction.hash]);
    if (!receipt) throw new Error("receipt not found");
    equal(receipt.status, "0x1", "receipt status");
    equal(Number(BigInt(receipt.blockNumber)), transaction.blockNumber, "receipt block");
  });
}

await check("legacy builder registry record", async () => {
  const resolution = await resolveLegacyBuilder({
    rpcUrl,
    registryAddress: manifest.contracts.builderRegistry,
    code: manifest.builder.code,
    timeoutMs: 15_000,
  });
  if (resolution.status === "unregistered") throw new Error("builder is not registered");
  equal(resolution.status, "registered-active", "builder status");
  equal(resolution.record.owner.toLowerCase(), manifest.builder.owner.toLowerCase(), "owner");
  equal(
    resolution.record.payoutAddress.toLowerCase(),
    manifest.builder.payoutAddress.toLowerCase(),
    "payout address",
  );
  equal(resolution.record.metadataURI, manifest.builder.metadataURI, "metadata URI");
});

await check("attributed ping transaction", async () => {
  const analysis = await analyzeTransaction({
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
  equal(analysis.attribution.declaration.schemaId, 0, "legacy schema ID");
  equal(analysis.attribution.declaration.codes.join(","), manifest.builder.code, "builder code");
  equal(
    analysis.attribution.declaration.originalCalldata,
    "0x773acdef0000000000000000000000000000000000000000000000000000000000000029",
    "original ping(41) calldata",
  );
});

await check("strict-calldata fallback proof", async () => {
  const originalCalldata =
    "0x56a316bb0000000000000000000000000000000000000000000000000000000000000029";
  const originalResult = await client.request(
    "eth_call",
    [{ to: manifest.contracts.strictCalldataDemo, data: originalCalldata }, "latest"],
  );
  equal(originalResult, "0x", "strictPing(41) original call result");

  const attributedCalldata = appendLegacyAttribution(originalCalldata, [manifest.builder.code]);
  try {
    await client.request(
      "eth_call",
      [{ to: manifest.contracts.strictCalldataDemo, data: attributedCalldata }, "latest"],
    );
    throw new Error("attributed strictPing(41) unexpectedly succeeded");
  } catch (error) {
    if (!(error instanceof JsonRpcError) || error.kind !== "rpc") throw error;
    const revertData = findHexData(error.data);
    if (revertData === undefined) throw new Error("strict revert did not include data");
    if (!revertData.toLowerCase().startsWith("0x7dc63f65")) {
      throw new Error(`unexpected strict revert selector: ${revertData.slice(0, 10)}`);
    }
    if (!revertData.toLowerCase().endsWith("41".padStart(64, "0"))) {
      throw new Error("strict revert did not report 65-byte attributed calldata");
    }
  }
});

if (failures.length > 0) {
  console.error(`\nFuji verification failed (${failures.length} check(s)):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    "\nFuji verification passed: source, bytecode, receipts, registry, attribution, and strict fallback agree.",
  );
}

async function check(label, action) {
  try {
    await action();
    console.log(`PASS ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`FAIL ${label}`);
  }
}

function equal(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected}, received ${actual}`);
  }
}

function keccak(value) {
  return execFileSync("cast", ["keccak", value], { encoding: "utf8" }).trim();
}

function findHexData(value) {
  if (typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value)) return value;
  if (typeof value !== "object" || value === null) return undefined;
  for (const nested of Object.values(value)) {
    const found = findHexData(nested);
    if (found !== undefined) return found;
  }
  return undefined;
}
