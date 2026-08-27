import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";

import { appendAttribution, decodeAttribution, prepareAttributedCall } from "../src/index.js";
import type { Hex } from "../src/index.js";

const request = {
  rpcUrl: "https://rpc.example.test",
  to: "0x1111111111111111111111111111111111111111" as Hex,
  calldata: "0x1234" as Hex,
  codes: ["avax-impact"],
  registryAddress: "0x3333333333333333333333333333333333333333" as Hex,
  registryChainId: 43113n,
};
const pinnedBlock = "0xabc" as Hex;

type RpcRequest = {
  readonly id: number;
  readonly method: string;
  readonly params: readonly unknown[];
};
type RpcPayload =
  | { readonly result: unknown }
  | { readonly error: { readonly code?: number; readonly message: string } };

function mockRpc(
  context: TestContext,
  handler: (body: RpcRequest) => RpcPayload | Promise<RpcPayload>,
): void {
  context.mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const body = JSON.parse(String(init?.body)) as RpcRequest;
      const payload = await handler(body);
      return Response.json({ jsonrpc: "2.0", id: body.id, ...payload });
    },
  );
}

function callData(body: RpcRequest): Hex {
  return (body.params[0] as { readonly data: Hex }).data;
}

function compatibleResponse(body: RpcRequest, returnData: Hex = "0x01"): RpcPayload {
  if (body.method === "eth_blockNumber") return { result: pinnedBlock };
  assert.equal(body.method, "eth_call");
  assert.equal(body.params[1], pinnedBlock);
  return { result: returnData };
}

test("pins one block and selects attributed calldata only after matching original and attributed calls", async (context) => {
  const expected = appendAttribution(request.calldata, {
    registryAddress: request.registryAddress,
    registryChainId: request.registryChainId,
    codes: request.codes,
  });
  const simulated: Hex[] = [];
  mockRpc(context, (body) => {
    if (body.method === "eth_call") simulated.push(callData(body));
    return compatibleResponse(body);
  });

  const result = await prepareAttributedCall(request);
  assert.equal(result.success, true);
  assert.equal(result.status, "attributed");
  assert.equal(result.selectedCalldata, expected);
  assert.equal(result.returnData, "0x01");
  assert.equal(result.originalReturnData, "0x01");
  assert.equal(result.attributedReturnData, "0x01");
  assert.equal(result.blockTag, pinnedBlock);
  assert.equal(result.compatibilityEvidence, "return-data-match");
  assert.deepEqual(simulated, [request.calldata, expected]);
});

test("accepts a caller-pinned block without requesting eth_blockNumber", async (context) => {
  const methods: string[] = [];
  mockRpc(context, (body) => {
    methods.push(body.method);
    assert.equal(body.method, "eth_call");
    assert.equal(body.params[1], "0x2a");
    return { result: "0x" };
  });

  const result = await prepareAttributedCall({ ...request, blockTag: "0x2a" });
  assert.equal(result.status, "attributed");
  assert.deepEqual(methods, ["eth_call", "eth_call"]);
});

test("accepts canonical quantities and uses identical context for both calls", async (context) => {
  let calls = 0;
  mockRpc(context, (body) => {
    if (body.method === "eth_blockNumber") return { result: pinnedBlock };
    const transaction = body.params[0] as { readonly value?: Hex; readonly from?: Hex };
    assert.equal(transaction.value, "0x0");
    assert.equal(transaction.from, "0x2222222222222222222222222222222222222222");
    calls += 1;
    return { result: "0x" };
  });

  const result = await prepareAttributedCall({
    ...request,
    value: "0x0",
    from: "0x2222222222222222222222222222222222222222",
  });
  assert.equal(result.success, true);
  assert.equal(calls, 2);
});

test("uses the required schema-one registry data only in the attributed payload", async (context) => {
  let calls = 0;
  mockRpc(context, (body) => {
    if (body.method === "eth_blockNumber") return { result: pinnedBlock };
    const data = callData(body);
    calls += 1;
    if (calls === 1) {
      assert.equal(data, request.calldata);
    } else {
      const declaration = decodeAttribution(data);
      assert.equal(declaration.registryChainId, 43113n);
      assert.equal(
        declaration.registryAddress,
        "0x3333333333333333333333333333333333333333",
      );
    }
    return { result: "0x" };
  });

  const result = await prepareAttributedCall(request);
  assert.equal(result.success, true);
});

test("falls back only when the original call succeeds and attributed call reverts", async (context) => {
  let calls = 0;
  mockRpc(context, (body) => {
    if (body.method === "eth_blockNumber") return { result: pinnedBlock };
    calls += 1;
    return calls === 1
      ? { result: "0x01" }
      : { error: { code: 3, message: "execution reverted" } };
  });

  const result = await prepareAttributedCall(request);
  assert.equal(result.status, "fallback");
  assert.equal(result.selectedCalldata, request.calldata);
  assert.equal(result.originalReturnData, "0x01");
  assert.equal(result.failureKind, "execution-reverted");
  assert.equal(result.failedStage, "attributed-call");
});

test("blocks when the original call itself reverts", async (context) => {
  mockRpc(context, (body) => body.method === "eth_blockNumber"
    ? { result: pinnedBlock }
    : { error: { code: 3, message: "execution reverted" } });

  const result = await prepareAttributedCall(request);
  assert.equal(result.status, "blocked");
  assert.equal(result.selectedCalldata, null);
  assert.equal(result.failureKind, "execution-reverted");
  assert.equal(result.failedStage, "original-call");
  assert.match(result.error, /viable baseline/);
});

test("blocks on different return data even when both calls succeed", async (context) => {
  let calls = 0;
  mockRpc(context, (body) => {
    if (body.method === "eth_blockNumber") return { result: pinnedBlock };
    calls += 1;
    return { result: calls === 1 ? "0x01" : "0x02" };
  });

  const result = await prepareAttributedCall(request);
  assert.equal(result.status, "blocked");
  assert.equal(result.failureKind, "return-data-mismatch");
  assert.equal(result.failedStage, "comparison");
  assert.equal(result.originalReturnData, "0x01");
  assert.equal(result.attributedReturnData, "0x02");
});

test("blocks attributed-call transport failures by default", async (context) => {
  let calls = 0;
  context.mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const body = JSON.parse(String(init?.body)) as RpcRequest;
      if (body.method === "eth_blockNumber") {
        return Response.json({ jsonrpc: "2.0", id: body.id, result: pinnedBlock });
      }
      calls += 1;
      if (calls === 2) throw new Error("network unavailable");
      return Response.json({ jsonrpc: "2.0", id: body.id, result: "0x" });
    },
  );

  const result = await prepareAttributedCall(request);
  assert.equal(result.status, "blocked");
  assert.equal(result.selectedCalldata, null);
  assert.equal(result.failureKind, "transport");
  assert.equal(result.failedStage, "attributed-call");
});

test("never policy blocks after an attributed execution revert", async (context) => {
  let calls = 0;
  mockRpc(context, (body) => {
    if (body.method === "eth_blockNumber") return { result: pinnedBlock };
    calls += 1;
    return calls === 1
      ? { result: "0x" }
      : { error: { code: 3, message: "execution reverted" } };
  });

  const result = await prepareAttributedCall({ ...request, fallbackPolicy: "never" });
  assert.equal(result.status, "blocked");
  assert.equal(result.selectedCalldata, null);
  assert.equal(result.failureKind, "execution-reverted");
});

test("blocks malformed attributed eth_call results", async (context) => {
  let calls = 0;
  mockRpc(context, (body) => {
    if (body.method === "eth_blockNumber") return { result: pinnedBlock };
    calls += 1;
    return { result: calls === 1 ? "0x" : 42 };
  });

  const result = await prepareAttributedCall(request);
  assert.equal(result.status, "blocked");
  assert.equal(result.failureKind, "invalid-result");
  assert.equal(result.failedStage, "attributed-call");
});

test("blocks when a stable block cannot be resolved", async (context) => {
  mockRpc(context, () => ({ error: { code: -32000, message: "node unavailable" } }));

  const result = await prepareAttributedCall(request);
  assert.equal(result.status, "blocked");
  assert.equal(result.blockTag, null);
  assert.equal(result.failedStage, "block-pinning");
});

test("rejects malformed addresses, block tags, and quantities before RPC", async () => {
  await assert.rejects(
    prepareAttributedCall({ ...request, to: "0x1234" }),
    /to must contain exactly 20 bytes/,
  );
  await assert.rejects(
    prepareAttributedCall({ ...request, value: "0x00" }),
    /canonical non-negative JSON-RPC quantity/,
  );
  await assert.rejects(
    prepareAttributedCall({ ...request, blockTag: "0x00" }),
    /canonical non-negative JSON-RPC quantity/,
  );
});
