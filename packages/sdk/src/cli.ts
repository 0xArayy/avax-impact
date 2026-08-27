#!/usr/bin/env node

import {
  analyzeTransaction,
  analyzeConfirmedTransaction,
  appendAttribution,
  decodeAttribution,
  encodeAttribution,
  prepareAttributedCall,
  resolveCodeRegistry,
  validateBuilderCode,
} from "./index.js";
import {
  appendLegacyAttribution,
  encodeLegacyAttribution,
  resolveLegacyBuilder,
} from "./legacy.js";
import { assertHex, assertRpcQuantity } from "./hex.js";
import type { Hex } from "./types.js";

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === undefined || command === "help" || command === "--help") {
    printHelp();
    return;
  }

  switch (command) {
    case "encode": {
      const calldata = requireHexOption(args, "--calldata");
      const codes = requireOptions(args, "--code");
      const registryAddress = requireHexOption(args, "--registry");
      const registryChainId = parsePositiveBigInt(
        requireOption(args, "--registry-chain-id"),
        "--registry-chain-id",
      );
      const declaration = { registryAddress, registryChainId, codes };
      printJson({
        format: "schema-1",
        suffix: encodeAttribution(declaration),
        calldata: appendAttribution(calldata, declaration),
        codes,
        registryAddress,
        registryChainId,
      });
      return;
    }
    case "encode-legacy": {
      const calldata = requireHexOption(args, "--calldata");
      const codes = requireOptions(args, "--code");
      printJson({
        format: "schema-0-legacy",
        suffix: encodeLegacyAttribution(codes),
        calldata: appendLegacyAttribution(calldata, codes),
        codes,
      });
      return;
    }
    case "decode": {
      const calldata = requireHexOption(args, "--calldata");
      printJson(decodeAttribution(calldata));
      return;
    }
    case "decode-tx": {
      const rpcUrl = requireOption(args, "--rpc");
      const transactionHash = requireHexOption(args, "--hash");
      const expectedChainIdValue = optionalOption(args, "--chain-id");
      const expectedChainId = expectedChainIdValue === undefined
        ? undefined
        : parsePositiveSafeInteger(expectedChainIdValue, "--chain-id");
      const analyzer = args.includes("--confirmed")
        ? analyzeConfirmedTransaction
        : analyzeTransaction;
      printJson(await analyzer({ rpcUrl, transactionHash, expectedChainId }));
      return;
    }
    case "resolve": {
      const request = {
        rpcUrl: requireOption(args, "--rpc"),
        registryAddress: requireHexOption(args, "--registry"),
        code: requireOption(args, "--code"),
      };
      printJson(await resolveCodeRegistry(request));
      return;
    }
    case "resolve-legacy": {
      printJson(await resolveLegacyBuilder({
        rpcUrl: requireOption(args, "--rpc"),
        registryAddress: requireHexOption(args, "--registry"),
        code: requireOption(args, "--code"),
      }));
      return;
    }
    case "preflight": {
      const from = optionalHexOption(args, "--from");
      const value = optionalRpcQuantityOption(args, "--value");
      const blockTag = optionalRpcQuantityOption(args, "--block-tag");
      const fallbackPolicyValue = optionalOption(args, "--fallback-policy") ?? "revert-only";
      if (fallbackPolicyValue !== "revert-only" && fallbackPolicyValue !== "never") {
        throw new Error("--fallback-policy must be revert-only or never");
      }
      printJson(await prepareAttributedCall({
        rpcUrl: requireOption(args, "--rpc"),
        to: requireHexOption(args, "--to"),
        calldata: requireHexOption(args, "--calldata"),
        codes: requireOptions(args, "--code"),
        registryAddress: requireHexOption(args, "--registry"),
        registryChainId: parsePositiveBigInt(
          requireOption(args, "--registry-chain-id"),
          "--registry-chain-id",
        ),
        fallbackPolicy: fallbackPolicyValue,
        ...(from === undefined ? {} : { from }),
        ...(value === undefined ? {} : { value }),
        ...(blockTag === undefined ? {} : { blockTag }),
      }));
      return;
    }
    case "validate": {
      const code = requireOption(args, "--code");
      printJson({ code, ...validateBuilderCode(code) });
      return;
    }
    default:
      throw new Error(`unknown command: ${command}`);
  }
}

function requireOption(args: readonly string[], name: string): string {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`missing required option ${name}`);
  }
  return value;
}

function optionalOption(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`missing value after ${name}`);
  }
  return value;
}

function requireOptions(args: readonly string[], name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name) {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`missing value after ${name}`);
      }
      values.push(value);
    }
  }
  if (values.length === 0) throw new Error(`missing required option ${name}`);
  return values;
}

function requireHexOption(args: readonly string[], name: string): Hex {
  const value = requireOption(args, name);
  assertHex(value, name);
  return value;
}

function optionalHexOption(args: readonly string[], name: string): Hex | undefined {
  const value = optionalOption(args, name);
  if (value === undefined) return undefined;
  assertHex(value, name);
  return value;
}

function optionalRpcQuantityOption(args: readonly string[], name: string): Hex | undefined {
  const value = optionalOption(args, name);
  if (value === undefined) return undefined;
  assertRpcQuantity(value, name);
  return value;
}

function parsePositiveBigInt(value: string, label: string): bigint {
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error(`${label} must be a positive integer`);
  return BigInt(value);
}

function parsePositiveSafeInteger(value: string, label: string): number {
  const parsed = Number(parsePositiveBigInt(value, label));
  if (!Number.isSafeInteger(parsed)) throw new Error(`${label} exceeds the safe integer range`);
  return parsed;
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, (_key, nested) =>
    typeof nested === "bigint" ? nested.toString() : nested, 2));
}

function printHelp(): void {
  console.log(`AVAX Impact attribution CLI

Usage:
  avax-impact encode --calldata 0x... --code avax-impact --registry 0x... --registry-chain-id 43113
  avax-impact encode-legacy --calldata 0x... --code avax-impact
  avax-impact decode --calldata 0x...
  avax-impact decode-tx --rpc https://... --hash 0x... [--chain-id 43113] [--confirmed]
  avax-impact resolve --rpc https://... --registry 0x... --code avax-impact
  avax-impact resolve-legacy --rpc https://... --registry 0x... --code avax-impact
  avax-impact preflight --rpc https://... --to 0x... --calldata 0x... --code avax-impact --registry 0x... --registry-chain-id 43113 [--from 0x...] [--value 0x0] [--block-tag 0x...] [--fallback-policy revert-only|never]
  avax-impact validate --code avax-impact`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
