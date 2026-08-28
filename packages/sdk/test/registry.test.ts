import assert from "node:assert/strict";
import test from "node:test";

import { resolveCodeRegistry } from "../src/index.js";
import { resolveLegacyBuilder } from "../src/legacy.js";
import type { Hex } from "../src/index.js";

const registryAddress = "0x3333333333333333333333333333333333333333" as Hex;
const payout = "0x4444444444444444444444444444444444444444" as Hex;

function word(value: bigint): string {
  return value.toString(16).padStart(64, "0");
}

function encodeAddress(value: Hex): Hex {
  return `0x${"0".repeat(24)}${value.slice(2)}`;
}

function encodeString(value: string): Hex {
  const bytes = Buffer.from(value, "utf8").toString("hex");
  const padded = bytes.padEnd(Math.ceil(bytes.length / 64) * 64, "0");
  return `0x${word(32n)}${word(BigInt(bytes.length / 2))}${padded}`;
}

test("resolves the pinned ICodeRegistry ABI", async (context) => {
  const methods: string[] = [];
  context.mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as {
        id: number;
        params: Array<{ data: Hex }>;
      };
      const selector = request.params[0]?.data.slice(0, 10);
      methods.push(selector ?? "");
      const result =
        selector === "0xc822d7f0" || selector === "0x25ed64a0"
          ? (`0x${word(1n)}` as Hex)
          : selector === "0xdfcde24b"
            ? encodeAddress(payout)
            : encodeString("ipfs://avax-impact");
      return Response.json({ jsonrpc: "2.0", id: request.id, result });
    },
  );

  const resolution = await resolveCodeRegistry({
    rpcUrl: "https://rpc.example.test",
    registryAddress,
    code: "avax-impact",
  });
  assert.equal(resolution.status, "registered");
  if (resolution.status === "registered") {
    assert.equal(resolution.record.payoutAddress, payout);
    assert.equal(resolution.record.codeURI, "ipfs://avax-impact");
    assert.equal(resolution.record.valid, true);
  }
  assert.deepEqual(
    methods.sort(),
    ["0x25ed64a0", "0xb2cbce0e", "0xc822d7f0", "0xdfcde24b"].sort(),
  );
});

test("does not query value getters for an unregistered code", async (context) => {
  let calls = 0;
  context.mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit) => {
      calls += 1;
      const request = JSON.parse(String(init?.body)) as {
        id: number;
        params: Array<{ data: Hex }>;
      };
      const selector = request.params[0]?.data.slice(0, 10);
      const result = `0x${word(selector === "0x25ed64a0" ? 1n : 0n)}`;
      return Response.json({ jsonrpc: "2.0", id: request.id, result });
    },
  );
  const resolution = await resolveCodeRegistry({
    rpcUrl: "https://rpc.example.test",
    registryAddress,
    code: "A",
  });
  assert.deepEqual(resolution, { status: "unregistered", code: "A", valid: true });
  assert.equal(calls, 2);
});

test("rejects malformed ABI responses", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit) => {
      const { id } = JSON.parse(String(init?.body)) as { id: number };
      return Response.json({ jsonrpc: "2.0", id, result: "0x02" });
    },
  );
  await assert.rejects(
    resolveCodeRegistry({
      rpcUrl: "https://rpc.example.test",
      registryAddress,
      code: "avax-impact",
    }),
    /one ABI word/,
  );
});

test("resolves the deployed AVAX Impact legacy record extension", async (context) => {
  const record = encodeLegacyRecord({
    code: "avax-impact",
    owner: "0x1111111111111111111111111111111111111111",
    payout,
    metadataURI: "https://example.test/avax-impact",
    registeredAt: 1_777_777_777n,
    active: true,
  });
  context.mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit) => {
      const { id } = JSON.parse(String(init?.body)) as { id: number };
      return Response.json({ jsonrpc: "2.0", id, result: record });
    },
  );
  const resolution = await resolveLegacyBuilder({
    rpcUrl: "https://rpc.example.test",
    registryAddress,
    code: "avax-impact",
  });
  assert.equal(resolution.status, "registered-active");
  assert.equal(resolution.record.code, "avax-impact");
  assert.equal(resolution.record.payoutAddress, payout);
  assert.equal(resolution.record.active, true);
});

test("maps the legacy CodeNotRegistered revert to an explicit state", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit) => {
      const { id } = JSON.parse(String(init?.body)) as { id: number };
      return Response.json({
        jsonrpc: "2.0",
        id,
        error: { code: 3, message: "execution reverted", data: "0x0063d2c3" },
      });
    },
  );
  const resolution = await resolveLegacyBuilder({
    rpcUrl: "https://rpc.example.test",
    registryAddress,
    code: "unknown-code",
  });
  assert.deepEqual(resolution, { status: "unregistered", code: "unknown-code" });
});

function encodeLegacyRecord(input: {
  code: string;
  owner: Hex;
  payout: Hex;
  metadataURI: string;
  registeredAt: bigint;
  active: boolean;
}): Hex {
  const codeTail = encodeStringTail(input.code);
  const metadataTail = encodeStringTail(input.metadataURI);
  const tupleHead = [
    word(192n),
    encodeAddress(input.owner).slice(2),
    encodeAddress(input.payout).slice(2),
    word(BigInt(192 + codeTail.length / 2)),
    word(input.registeredAt),
    word(input.active ? 1n : 0n),
  ].join("");
  return `0x${word(32n)}${tupleHead}${codeTail}${metadataTail}`;
}

function encodeStringTail(value: string): string {
  const bytes = Buffer.from(value, "utf8").toString("hex");
  return `${word(BigInt(bytes.length / 2))}${bytes.padEnd(Math.ceil(bytes.length / 64) * 64, "0")}`;
}
