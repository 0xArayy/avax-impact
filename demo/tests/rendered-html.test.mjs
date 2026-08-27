import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the AVAX Impact attribution readiness workbench", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>AVAX Impact — Attribution Readiness Workbench<\/title>/i);
  assert.match(html, /Know what the transaction/);
  assert.match(html, /Read the attribution trail/);
  assert.match(html, /Simulate before any signature/);
  assert.match(html, /Legacy wire prototype/i);
  assert.match(html, /Metadata, never authorization/i);
  assert.match(html, /zero private keys/i);
  assert.doesNotMatch(html, /connect wallet|private key input/i);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});
