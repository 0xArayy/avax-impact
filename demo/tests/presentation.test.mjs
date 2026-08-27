import assert from "node:assert/strict";
import test from "node:test";
import {
  createPreflightSample,
  describeChainContext,
  describePreflight,
  formatBlockNumber,
  parseBuilderCodes,
  SAMPLE_STRICT_CALLDATA,
  shortenHex,
  validateAddress,
  validateCalldata,
  validateTransactionHash,
} from "../lib/presentation.mjs";

test("strict Fuji sample targets strictPing(41), not the compatible ping selector", () => {
  assert.equal(
    SAMPLE_STRICT_CALLDATA,
    "0x56a316bb0000000000000000000000000000000000000000000000000000000000000029",
  );
  assert.notEqual(SAMPLE_STRICT_CALLDATA.slice(0, 10), "0x773acdef");
});

test("sample recovery resets every user-editable preflight field", () => {
  assert.deepEqual(
    createPreflightSample({
      to: "0x1111111111111111111111111111111111111111",
      calldata: "0x1234",
    }),
    {
      to: "0x1111111111111111111111111111111111111111",
      calldata: "0x1234",
      codesInput: "avax-impact",
      from: "",
      value: "0x0",
    },
  );
});

test("validates exact EVM input shapes", () => {
  assert.equal(validateTransactionHash(`0x${"ab".repeat(32)}`), null);
  assert.match(validateTransactionHash("0x1234"), /32-byte/);
  assert.equal(validateAddress(`0x${"12".repeat(20)}`), null);
  assert.match(validateAddress("0x1234"), /20-byte/);
  assert.equal(validateCalldata("0x1234abcd"), null);
  assert.match(validateCalldata("0x123"), /complete hexadecimal bytes/);
});

test("parses bounded lowercase builder codes", () => {
  assert.deepEqual(parseBuilderCodes("avax-impact, partner-1"), {
    codes: ["avax-impact", "partner-1"],
  });
  assert.match(parseBuilderCodes("AVAX").error, /not a valid lowercase/);
  assert.match(parseBuilderCodes("a,b,c,d,e").error, /one and four/);
});

test("presents safe fallback as the selected original payload", () => {
  const fallback = describePreflight({
    success: false,
    originalCalldata: "0x1234",
    selectedCalldata: "0x1234",
  });
  assert.equal(fallback.tone, "warning");
  assert.equal(fallback.title, "Safe fallback selected");
  assert.match(fallback.detail, /untouched original calldata/);

  const compatible = describePreflight({
    success: true,
    originalCalldata: "0x1234",
    selectedCalldata: "0x123400",
  });
  assert.equal(compatible.tone, "success");
  assert.match(compatible.detail, /external signer/);
});

test("never invents Fuji provenance for raw calldata", () => {
  assert.equal(
    describeChainContext({ source: "local-calldata", schemaId: 0 }),
    "Not encoded by schema 0",
  );
  assert.equal(
    describeChainContext({ source: "local-calldata", schemaId: 1, registryChainId: 8453n }),
    "Embedded registry chain · 8453",
  );
  assert.equal(
    describeChainContext({ source: "local-calldata", schemaId: 1, registryChainId: 43113n }),
    "Embedded Fuji registry · 43113",
  );
});

test("labels pending transactions and formats confirmed blocks", () => {
  assert.equal(formatBlockNumber(null), "Pending");
  assert.equal(formatBlockNumber(1234567), "1,234,567");
});

test("shortens long hex without losing both ends", () => {
  assert.equal(shortenHex("0x1234", 4, 2), "0x1234");
  assert.equal(shortenHex("0x1234567890abcdef", 6, 4), "0x1234…cdef");
});
