import assert from "node:assert/strict";
import test from "node:test";

import { appendAttribution, prepareAttributedCall } from "../src/index.js";
import type { Hex } from "../src/index.js";

const request = {
  rpcUrl: "https://rpc.example.test",
  to: "0x1111111111111111111111111111111111111111" as Hex,
  calldata: "0x1234" as Hex,
  codes: ["avax-impact"],
};

test("selects attributed calldata after a successful eth_call", async (context) => {
  const expected = appendAttribution(request.calldata, request.codes);
  context.mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const body = JSON.parse(String(init?.body)) as {
        method: string;
        params: Array<{ data: Hex }>;
      };
      assert.equal(body.method, "eth_call");
      assert.equal(body.params[0]?.data, expected);
      return Response.json({ jsonrpc: "2.0", id: 1, result: "0x01" });
    },
  );

  const result = await prepareAttributedCall(request);
  assert.equal(result.success, true);
  assert.equal(result.selectedCalldata, expected);
  assert.equal(result.returnData, "0x01");
});

test("accepts canonical JSON-RPC quantities such as zero value", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const body = JSON.parse(String(init?.body)) as {
        params: Array<{ value?: Hex }>;
      };
      assert.equal(body.params[0]?.value, "0x0");
      return Response.json({ jsonrpc: "2.0", id: 1, result: "0x" });
    },
  );

  const result = await prepareAttributedCall({ ...request, value: "0x0" });
  assert.equal(result.success, true);
});

test("falls back to original calldata when the attributed call reverts", async (context) => {
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({
      jsonrpc: "2.0",
      id: 1,
      error: { code: 3, message: "execution reverted" },
    }),
  );

  const result = await prepareAttributedCall(request);
  assert.equal(result.success, false);
  assert.equal(result.selectedCalldata, request.calldata);
  assert.equal(result.error, "execution reverted");
});

test("falls back to original calldata on an RPC transport failure", async (context) => {
  context.mock.method(globalThis, "fetch", async () => {
    throw new Error("network unavailable");
  });

  const result = await prepareAttributedCall(request);
  assert.equal(result.success, false);
  assert.equal(result.selectedCalldata, request.calldata);
  assert.equal(result.error, "network unavailable");
});

test("rejects malformed addresses and non-canonical quantities before RPC", async () => {
  await assert.rejects(
    prepareAttributedCall({ ...request, to: "0x1234" }),
    /to must contain exactly 20 bytes/,
  );
  await assert.rejects(
    prepareAttributedCall({ ...request, value: "0x00" }),
    /canonical non-negative JSON-RPC quantity/,
  );
});
