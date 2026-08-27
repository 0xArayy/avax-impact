import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";

const cli = new URL("../src/cli.js", import.meta.url);

function mockFetchImport(expectedValue: string): string {
  const source = `
    globalThis.fetch = async (_input, init) => {
      const body = JSON.parse(String(init?.body));
      if (body.params?.[0]?.value !== ${JSON.stringify(expectedValue)}) {
        throw new Error("unexpected RPC value: " + body.params?.[0]?.value);
      }
      return Response.json({ jsonrpc: "2.0", id: body.id, result: "0x" });
    };
  `;
  return `data:text/javascript,${encodeURIComponent(source)}`;
}

function preflightArgs(value: string): string[] {
  return [
    cli.pathname,
    "preflight",
    "--rpc",
    "https://rpc.example.test",
    "--to",
    "0x1111111111111111111111111111111111111111",
    "--calldata",
    "0x1234",
    "--code",
    "avax-impact",
    "--value",
    value,
  ];
}

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

test("CLI preflight accepts canonical JSON-RPC quantities including zero", () => {
  for (const value of ["0x0", "0x1", "0x10"]) {
    const output = execFileSync(
      process.execPath,
      ["--import", mockFetchImport(value), ...preflightArgs(value)],
      { encoding: "utf8" },
    );
    const result = JSON.parse(output) as Record<string, unknown>;
    assert.equal(result.success, true, value);
  }
});

test("CLI preflight rejects non-canonical or malformed quantities before RPC", () => {
  for (const value of ["0x00", "0x01", "0x", "", "0", "1"]) {
    const result = spawnSync(
      process.execPath,
      ["--import", mockFetchImport("never"), ...preflightArgs(value)],
      { encoding: "utf8" },
    );
    assert.notEqual(result.status, 0, value);
    assert.match(result.stderr, /canonical non-negative JSON-RPC quantity/, value);
    assert.doesNotMatch(result.stderr, /unexpected RPC value/, value);
  }
});

test("CLI preflight keeps calldata byte validation separate from value quantities", () => {
  const result = spawnSync(
    process.execPath,
    ["--import", mockFetchImport("never"), ...preflightArgs("0x0").map((argument) =>
      argument === "0x1234" ? "0x123" : argument)],
    { encoding: "utf8" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--calldata must contain an even number of hexadecimal characters/);
  assert.doesNotMatch(result.stderr, /unexpected RPC value/);
});
