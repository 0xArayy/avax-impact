#!/usr/bin/env node

import {
  appendAttribution,
  decodeAttribution,
  encodeAttribution,
  validateBuilderCode,
} from "./index.js";
import { assertHex } from "./hex.js";
import type { Hex } from "./types.js";

interface RpcTransaction {
  readonly hash: Hex;
  readonly input: Hex;
  readonly from: Hex;
  readonly to: Hex | null;
  readonly blockNumber: Hex | null;
}

interface RpcResponse {
  readonly result?: RpcTransaction | null;
  readonly error?: { readonly code?: number; readonly message?: string };
}

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
      printJson({
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
      const transaction = await fetchTransaction(rpcUrl, transactionHash);
      printJson({ transaction, attribution: decodeAttribution(transaction.input) });
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

async function fetchTransaction(rpcUrl: string, hash: Hex): Promise<RpcTransaction> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionByHash",
      params: [hash],
    }),
  });
  if (!response.ok) throw new Error(`RPC returned HTTP ${response.status}`);

  const payload = (await response.json()) as RpcResponse;
  if (payload.error !== undefined) {
    throw new Error(payload.error.message ?? `RPC error ${payload.error.code ?? "unknown"}`);
  }
  if (payload.result === undefined || payload.result === null) {
    throw new Error(`transaction not found: ${hash}`);
  }
  assertHex(payload.result.input, "transaction input");
  return payload.result;
}

function requireOption(args: readonly string[], name: string): string {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`missing required option ${name}`);
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

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp(): void {
  console.log(`AVAX Impact attribution CLI

Usage:
  avax-impact encode --calldata 0x... --code avax-impact [--code partner]
  avax-impact decode --calldata 0x...
  avax-impact decode-tx --rpc https://... --hash 0x...
  avax-impact validate --code avax-impact`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
