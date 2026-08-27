#!/usr/bin/env node

import {
  analyzeTransaction,
  appendAttribution,
  appendAttributionV1,
  decodeAttribution,
  encodeAttribution,
  encodeAttributionV1,
  prepareAttributedCall,
  resolveCodeRegistry,
  resolveLegacyBuilder,
  validateBuilderCode,
} from "./index.js";
import { assertHex } from "./hex.js";
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
      const registryAddress = optionalHexOption(args, "--registry");
      const registryChainIdValue = optionalOption(args, "--registry-chain-id");
      if ((registryAddress === undefined) !== (registryChainIdValue === undefined)) {
        throw new Error("--registry and --registry-chain-id must be provided together");
      }
      if (registryAddress !== undefined && registryChainIdValue !== undefined) {
        const registryChainId = parsePositiveBigInt(registryChainIdValue, "--registry-chain-id");
        const declaration = { registryAddress, registryChainId, codes };
        printJson({
          format: "schema-1",
          suffix: encodeAttributionV1(declaration),
          calldata: appendAttributionV1(calldata, declaration),
          codes,
          registryAddress,
          registryChainId,
        });
        return;
      }
      printJson({
        format: "schema-0-legacy",
        suffix: encodeAttribution(codes),
        calldata: appendAttribution(calldata, codes),
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
      printJson(await analyzeTransaction({ rpcUrl, transactionHash, expectedChainId }));
      return;
    }
    case "resolve": {
      const request = {
        rpcUrl: requireOption(args, "--rpc"),
        registryAddress: requireHexOption(args, "--registry"),
        code: requireOption(args, "--code"),
      };
      const kind = optionalOption(args, "--kind") ?? "standard";
      if (kind !== "standard" && kind !== "legacy") {
        throw new Error("--kind must be standard or legacy");
      }
      printJson(
        kind === "standard"
          ? await resolveCodeRegistry(request)
          : await resolveLegacyBuilder(request),
      );
      return;
    }
    case "preflight": {
      const registryAddress = optionalHexOption(args, "--registry");
      const registryChainIdValue = optionalOption(args, "--registry-chain-id");
      printJson(await prepareAttributedCall({
        rpcUrl: requireOption(args, "--rpc"),
        to: requireHexOption(args, "--to"),
        calldata: requireHexOption(args, "--calldata"),
        codes: requireOptions(args, "--code"),
        ...(optionalHexOption(args, "--from") === undefined
          ? {}
          : { from: optionalHexOption(args, "--from") }),
        ...(optionalHexOption(args, "--value") === undefined
          ? {}
          : { value: optionalHexOption(args, "--value") }),
        ...(registryAddress === undefined ? {} : { registryAddress }),
        ...(registryChainIdValue === undefined
          ? {}
          : { registryChainId: parsePositiveBigInt(registryChainIdValue, "--registry-chain-id") }),
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
  avax-impact encode --calldata 0x... --code avax-impact [--code partner]
  avax-impact encode --calldata 0x... --code avax-impact --registry 0x... --registry-chain-id 43113
  avax-impact decode --calldata 0x...
  avax-impact decode-tx --rpc https://... --hash 0x... [--chain-id 43113]
  avax-impact resolve --rpc https://... --registry 0x... --code avax-impact [--kind standard|legacy]
  avax-impact preflight --rpc https://... --to 0x... --calldata 0x... --code avax-impact [--from 0x...] [--value 0x0]
  avax-impact validate --code avax-impact`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
