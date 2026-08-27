import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeConfirmedTransaction,
  analyzeTransaction,
  appendAttribution,
  TransactionNotFoundError,
} from "../src/index.js";
import type { Hex } from "../src/index.js";

const hash = `0x${"ab".repeat(32)}` as Hex;
const baseTransaction = {
  hash,
  input: appendAttribution("0x1234", ["avax-impact"]),
  from: "0x1111111111111111111111111111111111111111",
  to: "0x2222222222222222222222222222222222222222",
  value: "0x0",
  blockNumber: "0x10",
};

function rpcFetch(transaction: unknown): typeof globalThis.fetch {
  return async (_input, init) => {
    const request = JSON.parse(String(init?.body)) as { id: number; method: string };
    const result = request.method === "eth_chainId" ? "0xa869" : transaction;
    return Response.json({ jsonrpc: "2.0", id: request.id, result });
  };
}

test("analyzes a declared Avalanche Fuji transaction", async (context) => {
  context.mock.method(globalThis, "fetch", rpcFetch(baseTransaction));
  const analysis = await analyzeTransaction({
    rpcUrl: "https://rpc.example.test",
    transactionHash: hash,
    expectedChainId: 43113,
  });
  assert.equal(analysis.chainId, 43113);
  assert.equal(analysis.attribution.status, "declared");
  if (analysis.attribution.status === "declared") {
    assert.deepEqual(analysis.attribution.declaration.codes, ["avax-impact"]);
    assert.equal(analysis.attribution.declaration.originalCalldata, "0x1234");
  }
});

test("distinguishes unattributed and malformed attribution", async (context) => {
  context.mock.method(globalThis, "fetch", rpcFetch({ ...baseTransaction, input: "0x1234" }));
  assert.equal(
    (await analyzeTransaction({ rpcUrl: "https://rpc.example.test", transactionHash: hash }))
      .attribution.status,
    "unattributed",
  );

  context.mock.restoreAll();
  const malformed =
    "0x1234617661782d696d706163740b0280218021802180218021802180218021" as Hex;
  context.mock.method(globalThis, "fetch", rpcFetch({ ...baseTransaction, input: malformed }));
  assert.equal(
    (await analyzeTransaction({ rpcUrl: "https://rpc.example.test", transactionHash: hash }))
      .attribution.status,
    "malformed",
  );
});

test("rejects missing transactions, wrong networks, and malformed transaction fields", async (context) => {
  context.mock.method(globalThis, "fetch", rpcFetch(null));
  await assert.rejects(
    analyzeTransaction({ rpcUrl: "https://rpc.example.test", transactionHash: hash }),
    TransactionNotFoundError,
  );

  context.mock.restoreAll();
  context.mock.method(globalThis, "fetch", rpcFetch(baseTransaction));
  await assert.rejects(
    analyzeTransaction({
      rpcUrl: "https://rpc.example.test",
      transactionHash: hash,
      expectedChainId: 43114,
    }),
    /unexpected chain ID/,
  );

  context.mock.restoreAll();
  context.mock.method(globalThis, "fetch", rpcFetch({ ...baseTransaction, from: "0x1234" }));
  await assert.rejects(
    analyzeTransaction({ rpcUrl: "https://rpc.example.test", transactionHash: hash }),
    /transaction from must contain exactly 20 bytes/,
  );
});

function confirmedRpcFetch(
  transaction: unknown,
  receipt: unknown,
): typeof globalThis.fetch {
  return async (_input, init) => {
    const request = JSON.parse(String(init?.body)) as { id: number; method: string };
    const result = request.method === "eth_chainId"
      ? "0xa869"
      : request.method === "eth_getTransactionReceipt"
        ? receipt
        : transaction;
    return Response.json({ jsonrpc: "2.0", id: request.id, result });
  };
}

test("requires a mined, successful receipt for confirmed analysis", async (context) => {
  const receipt = { transactionHash: hash, blockNumber: "0x10", status: "0x1" };
  context.mock.method(globalThis, "fetch", confirmedRpcFetch(baseTransaction, receipt));
  const analysis = await analyzeConfirmedTransaction({
    rpcUrl: "https://rpc.example.test",
    transactionHash: hash,
    expectedChainId: 43113,
  });
  assert.equal(analysis.receipt.status, "0x1");
  assert.equal(analysis.attribution.status, "declared");
});

test("rejects pending and reverted transactions in confirmed analysis", async (context) => {
  const receipt = { transactionHash: hash, blockNumber: "0x10", status: "0x1" };
  context.mock.method(
    globalThis,
    "fetch",
    confirmedRpcFetch({ ...baseTransaction, blockNumber: null }, receipt),
  );
  await assert.rejects(
    analyzeConfirmedTransaction({ rpcUrl: "https://rpc.example.test", transactionHash: hash }),
    /transaction is pending/,
  );

  context.mock.restoreAll();
  context.mock.method(
    globalThis,
    "fetch",
    confirmedRpcFetch(baseTransaction, { ...receipt, status: "0x0" }),
  );
  await assert.rejects(
    analyzeConfirmedTransaction({ rpcUrl: "https://rpc.example.test", transactionHash: hash }),
    /transaction execution failed/,
  );
});

test("rejects inconsistent receipt identity", async (context) => {
  const otherHash = `0x${"cd".repeat(32)}` as Hex;
  context.mock.method(
    globalThis,
    "fetch",
    confirmedRpcFetch(baseTransaction, {
      transactionHash: otherHash,
      blockNumber: "0x10",
      status: "0x1",
    }),
  );
  await assert.rejects(
    analyzeConfirmedTransaction({ rpcUrl: "https://rpc.example.test", transactionHash: hash }),
    /receipt hash does not match/,
  );
});
