import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const artifacts = {
  builderRegistry: "contracts/out/BuilderRegistry.sol/BuilderRegistry.json",
  attributionDemo: "contracts/out/AttributionDemo.sol/AttributionDemo.json",
  strictCalldataDemo: "contracts/out/AttributionDemo.sol/StrictCalldataDemo.json",
};

export function createCheckRunner() {
  const failures = [];
  return {
    failures,
    async check(label, action) {
      try {
        await action();
        console.log(`PASS ${label}`);
      } catch (error) {
        failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`FAIL ${label}`);
      }
    },
  };
}

export function verifySourceCommit(manifest) {
  execFileSync("git", ["cat-file", "-e", `${manifest.sourceCommit}^{commit}`], {
    stdio: "ignore",
  });
}

export function verifySourceTag(manifest) {
  const taggedCommit = execFileSync("git", ["rev-list", "-n", "1", manifest.sourceTag], {
    encoding: "utf8",
  }).trim();
  equal(taggedCommit, manifest.sourceCommit, "source tag commit");
}

export async function verifyRebuiltRuntimes(manifest, temporaryPrefix) {
  const sourceDirectory = await mkdtemp(join(tmpdir(), temporaryPrefix));
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
}

export async function verifyChainId(client, manifest) {
  const chainId = await client.request("eth_chainId");
  equal(Number(BigInt(chainId)), manifest.chainId, "chain ID");
}

export async function verifyLiveRuntime(client, manifest, name, address) {
  const code = await client.request("eth_getCode", [address, "latest"]);
  if (typeof code !== "string" || code === "0x") throw new Error("contract has no code");
  const expected = manifest.runtimeBytecode[name];
  equal((code.length - 2) / 2, expected.bytes, "runtime byte length");
  equal(keccak(code), expected.keccak256, "runtime bytecode hash");
}

export async function verifyReceipt(client, transaction) {
  const receipt = await client.request("eth_getTransactionReceipt", [transaction.hash]);
  if (!receipt) throw new Error("receipt not found");
  equal(receipt.status, "0x1", "receipt status");
  equal(Number(BigInt(receipt.blockNumber)), transaction.blockNumber, "receipt block");
}

export function equal(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch: expected ${expected}, received ${actual}`);
  }
}

export function findHexData(value) {
  if (typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value)) return value;
  if (typeof value !== "object" || value === null) return undefined;
  for (const nested of Object.values(value)) {
    const found = findHexData(nested);
    if (found !== undefined) return found;
  }
  return undefined;
}

function keccak(value) {
  return execFileSync("cast", ["keccak", value], { encoding: "utf8" }).trim();
}
