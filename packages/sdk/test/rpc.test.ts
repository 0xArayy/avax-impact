import assert from "node:assert/strict";
import test from "node:test";

import { JsonRpcClient, JsonRpcError } from "../src/index.js";

test("validates JSON-RPC envelopes and returns results", async () => {
  const client = new JsonRpcClient({
    url: "https://rpc.example.test",
    fetch: async (_input, init) => {
      const request = JSON.parse(String(init?.body)) as { id: number; method: string };
      assert.equal(request.method, "eth_chainId");
      return Response.json({ jsonrpc: "2.0", id: request.id, result: "0xa869" });
    },
  });
  assert.equal(await client.request("eth_chainId"), "0xa869");
});

test("binds the host fetch implementation for browser-compatible invocation", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    function hostFetch(this: unknown, _input: string | URL | Request, init?: RequestInit) {
      assert.equal(this, globalThis);
      const request = JSON.parse(String(init?.body)) as { id: number };
      return Promise.resolve(
        Response.json({ jsonrpc: "2.0", id: request.id, result: "0xa869" }),
      );
    },
  );
  const client = new JsonRpcClient({ url: "https://rpc.example.test" });
  assert.equal(await client.request("eth_chainId"), "0xa869");
});

test("classifies HTTP, malformed, and RPC errors", async () => {
  const cases: Array<{
    fetch: typeof globalThis.fetch;
    kind: JsonRpcError["kind"];
  }> = [
    { fetch: async () => new Response("down", { status: 503 }), kind: "http" },
    { fetch: async () => new Response("not-json"), kind: "malformed" },
    {
      fetch: async () => Response.json({ jsonrpc: "2.0", id: 999, result: "0x1" }),
      kind: "malformed",
    },
    {
      fetch: async (_input, init) => {
        const { id } = JSON.parse(String(init?.body)) as { id: number };
        return Response.json({
          jsonrpc: "2.0",
          id,
          error: { code: -32000, message: "execution reverted", data: "0xdead" },
        });
      },
      kind: "rpc",
    },
  ];

  for (const fixture of cases) {
    const client = new JsonRpcClient({ url: "https://rpc.example.test", fetch: fixture.fetch });
    await assert.rejects(client.request("eth_call"), (error: unknown) => {
      assert.ok(error instanceof JsonRpcError);
      assert.equal(error.kind, fixture.kind);
      return true;
    });
  }
});

test("classifies timeouts and caller aborts", async () => {
  const pendingFetch: typeof globalThis.fetch = async (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
    });

  const timeoutClient = new JsonRpcClient({
    url: "https://rpc.example.test",
    fetch: pendingFetch,
    timeoutMs: 5,
  });
  await assert.rejects(timeoutClient.request("eth_chainId"), (error: unknown) => {
    assert.ok(error instanceof JsonRpcError);
    assert.equal(error.kind, "timeout");
    return true;
  });

  const controller = new AbortController();
  const abortClient = new JsonRpcClient({
    url: "https://rpc.example.test",
    fetch: pendingFetch,
    timeoutMs: 1_000,
  });
  const request = abortClient.request("eth_chainId", [], { signal: controller.signal });
  controller.abort();
  await assert.rejects(request, (error: unknown) => {
    assert.ok(error instanceof JsonRpcError);
    assert.equal(error.kind, "aborted");
    return true;
  });
});
