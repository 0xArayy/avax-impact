import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

test("builds a stable static Cloudflare application shell", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /<title>AVAX Impact — Builder Attribution SDK<\/title>/i);
  assert.match(html, /<div id="root"><\/div>/i);
  assert.match(html, /<script[^>]+type="module"[^>]+src="\/assets\/[^"]+\.js"/i);
  assert.doesNotMatch(html, /_vinext|__next|react-server-dom/i);

  const assets = await readdir(new URL("../dist/assets/", import.meta.url));
  assert.ok(assets.some((name) => name.endsWith(".js")));
  assert.ok(assets.some((name) => name.endsWith(".css")));
});

test("keeps schema 1 as the visible default and isolates historical evidence", async () => {
  const source = await readFile(new URL("../app/DecoderDemo.tsx", import.meta.url), "utf8");
  assert.match(source, /Default format/);
  assert.match(source, /Schema 1 · pinned ERC-8021 draft/);
  assert.doesNotMatch(source, /Schema 0 status|Legacy wire prototype|Fuji prototype/);

  const historical = await readFile(new URL("../app/LegacyResolution.tsx", import.meta.url), "utf8");
  assert.match(historical, /<details/);
  assert.match(historical, /Historical schema 0 evidence/);
});

test("uses stable Vite and static Cloudflare Assets without beta runtime packages", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  assert.equal(dependencies.vinext, undefined);
  assert.equal(dependencies["@vinext/cloudflare"], undefined);
  assert.equal(dependencies["react-server-dom-webpack"], undefined);

  const wrangler = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  assert.match(wrangler, /"directory": "\.\/dist"/);
  assert.match(wrangler, /"not_found_handling": "single-page-application"/);
  assert.doesNotMatch(wrangler, /"main"/);
});
