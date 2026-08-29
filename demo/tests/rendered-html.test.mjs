import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { decodeAttribution } from "@avax-impact/sdk";

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
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(source, /Default format/);
  assert.match(source, /Schema 1 · pinned ERC-8021 draft/);
  assert.match(source, /Independent open-source project · not an official Avalanche service/);
  assert.match(source, /import demoPackage from "\.\.\/package\.json"/);
  assert.match(source, /GitHub · v\{PROJECT_VERSION\} ↗/);
  assert.equal(packageJson.version, "0.1.1");
  const inspectPanel = await readFile(new URL("../app/InspectPanel.tsx", import.meta.url), "utf8");
  assert.match(inspectPanel, /CurrentRegistryResolution/);
  assert.doesNotMatch(source, /Schema 0 status|Legacy wire prototype|Fuji prototype/);

  const historical = await readFile(new URL("../app/LegacyResolution.tsx", import.meta.url), "utf8");
  assert.match(historical, /<details/);
  assert.match(historical, /Historical schema 0 evidence/);

  const current = await readFile(new URL("../app/CurrentRegistryResolution.tsx", import.meta.url), "utf8");
  assert.match(current, /Current schema 1 registry/);
  assert.match(current, /Declared schema 1 registry/);
  assert.match(current, /Verify current registry on Fuji/);
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

test("keeps the default workbench sample aligned with verified schema 1 evidence", async () => {
  const workbench = await readFile(new URL("../lib/workbench.ts", import.meta.url), "utf8");
  const manifest = JSON.parse(
    await readFile(new URL("../../deployments/fuji-schema1.json", import.meta.url), "utf8"),
  );
  const sampleCalldata = workbench.match(/export const SAMPLE_CALLDATA =\s*\n\s*"(0x[0-9a-f]+)"/)?.[1];
  const sampleTransaction = workbench.match(/export const SAMPLE_TRANSACTION =\s*\n\s*"(0x[0-9a-f]+)"/)?.[1];
  assert.ok(sampleCalldata);
  assert.equal(sampleTransaction, manifest.transactions.attributedPing.hash);

  const declaration = decodeAttribution(sampleCalldata);
  assert.equal(declaration.schemaId, 1);
  assert.equal(declaration.registryAddress?.toLowerCase(), manifest.contracts.builderRegistry.toLowerCase());
  assert.equal(declaration.registryChainId, BigInt(manifest.chainId));
  assert.deepEqual(declaration.codes, [manifest.builder.code]);
  assert.equal(
    declaration.originalCalldata,
    "0x773acdef0000000000000000000000000000000000000000000000000000000000000029",
  );
});
