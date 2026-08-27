import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";

const cli = new URL("../src/cli.js", import.meta.url);

test("CLI exposes the complete read-only and preflight workflow", () => {
  const output = execFileSync(process.execPath, [cli.pathname, "--help"], { encoding: "utf8" });
  assert.match(output, /decode-tx/);
  assert.match(output, /resolve/);
  assert.match(output, /preflight/);
});

test("CLI emits JSON-safe schema-one output pinned to Avalanche registry context", () => {
  const output = execFileSync(
    process.execPath,
    [
      cli.pathname,
      "encode",
      "--calldata",
      "0x1234",
      "--code",
      "avax-impact",
      "--registry",
      "0x1111111111111111111111111111111111111111",
      "--registry-chain-id",
      "43113",
    ],
    { encoding: "utf8" },
  );
  const result = JSON.parse(output) as Record<string, unknown>;
  assert.equal(result.format, "schema-1");
  assert.equal(result.registryChainId, "43113");
  assert.match(String(result.calldata), /0180218021802180218021802180218021$/);
});

test("CLI rejects partial schema-one context", () => {
  const result = spawnSync(
    process.execPath,
    [
      cli.pathname,
      "encode",
      "--calldata",
      "0x1234",
      "--code",
      "avax-impact",
      "--registry",
      "0x1111111111111111111111111111111111111111",
    ],
    { encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must be provided together/);
});
