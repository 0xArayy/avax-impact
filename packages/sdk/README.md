# @avax-impact/sdk

Transaction attribution helpers for Avalanche, evaluated against the ERC-8021 draft
pinned at
[`457532f5c064a4619868ee5e4950f0cc32a7917e`](https://github.com/ilikesymmetry/ERCs/blob/457532f5c064a4619868ee5e4950f0cc32a7917e/ERCS/erc-8021.md).

ERC-8021 remains a draft. This package supports the pinned schema 1 format and the
earlier AVAX Impact schema 0 prototype. `ATTRIBUTION_FORMAT_VERSION` and
`LEGACY_FORMAT_VERSION` expose those exact identifiers.

## Install status

The package is not published to npm during the MVP. From this repository:

```bash
npm install
npm run build --workspace @avax-impact/sdk
```

Do not rely on `npm install @avax-impact/sdk` until a public package release is linked
from this README.

## Encode and decode

Pinned schema 1 embeds the registry address and chain ID:

```ts
import {
  appendAttributionV1,
  ATTRIBUTION_FORMAT_VERSION,
  decodeAttribution,
} from "@avax-impact/sdk";

const attributed = appendAttributionV1("0x1234", {
  registryAddress: "0xcccccccccccccccccccccccccccccccccccccccc",
  registryChainId: 43113n,
  codes: ["avax-impact"],
});
const decoded = decodeAttribution(attributed);

console.log(ATTRIBUTION_FORMAT_VERSION);
console.log(decoded.schemaId); // 1
console.log(decoded.originalCalldata); // "0x1234"
console.log(decoded.registryChainId); // 43113n
```

The legacy helpers `appendAttribution` and `encodeAttribution` produce schema 0. They
remain available to decode and verify the historical Fuji prototype, not as a claim of
canonical schema 0 registry interoperability.

Shared positive and malformed examples are exported as `CONFORMANCE_VECTORS`.
Wire codes follow the pinned draft's nonempty 7-bit ASCII/no-comma/255-byte payload
rules. Repetition and one-byte codes are valid at the wire layer. The stricter
`validateBuilderCode` rules describe AVAX Impact's registry policy, not universal
ERC-8021 parsing.

## Dry-run compatibility

Some contracts reject trailing calldata. The SDK resolves one block, executes the
original and attributed calls with identical sender/value context, and compares their
return data. The default policy falls back only when the original baseline succeeded
and the attributed call produced a recognized execution revert. Transport, timeout,
HTTP, malformed-response, original-call, and return-data-mismatch failures block handoff:

```ts
import { prepareAttributedCall } from "@avax-impact/sdk";

const prepared = await prepareAttributedCall({
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  to: "0x0000000000000000000000000000000000000001",
  from: "0x0000000000000000000000000000000000000002",
  value: "0x0",
  calldata: "0x1234",
  codes: ["avax-impact"],
  registryAddress: "0xcccccccccccccccccccccccccccccccccccccccc",
  registryChainId: 43113n,
});

if (prepared.status === "blocked") {
  throw new Error(`preflight inconclusive: ${prepared.failureKind}`);
}
sendTransaction({ to: "0x...", data: prepared.selectedCalldata });
```

When both registry fields are supplied, the helper prepares schema 1. Without them it
prepares legacy schema 0. The result includes the pinned `blockTag` and both return-data
values. Equality is point-in-time compatibility evidence, not proof of equal state
effects or a promise that a later transaction will succeed. Set
`fallbackPolicy` to `never` to block on every failure, or `any-error` only when the
application intentionally owns that risk.

## Wallet batch handoff

For wallets implementing ERC-5792 `wallet_sendCalls`, let the wallet append the suffix:

```ts
import { createDataSuffixCapability } from "@avax-impact/sdk";

const capabilities = createDataSuffixCapability({
  codes: ["avax-impact"],
  registryAddress: "0xcccccccccccccccccccccccccccccccccccccccc",
  registryChainId: 43113n,
});

await provider.request({
  method: "wallet_sendCalls",
  params: [{ version: "2.0.0", chainId: "0xa869", calls, capabilities }],
});
```

This is a capability handoff, not a claim that every wallet supports `dataSuffix` or
that AVAX Impact directly decodes arbitrary ERC-4337 user operations.

## Transaction fetch/decode and registry reads

```ts
import { analyzeConfirmedTransaction, resolveCodeRegistry } from "@avax-impact/sdk";

const analysis = await analyzeConfirmedTransaction({
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  transactionHash: "0x...",
  expectedChainId: 43113,
});

const resolution = await resolveCodeRegistry({
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  registryAddress: "0x...",
  code: "avax-impact",
});
```

`analyzeConfirmedTransaction` rejects pending transactions, missing/inconsistent
receipts, and failed execution. `analyzeTransaction` remains available for inspection
of pending or reverted transactions and must not be used as proof of confirmation.

`resolveCodeRegistry` reads the pinned `ICodeRegistry` ABI: `payoutAddress`, `codeURI`,
`isValidCode`, and `isRegistered`. `resolveLegacyBuilder` exists only for the historical
AVAX Impact Fuji registry and returns its extended owner/timestamp/lifecycle record.
The deployed Fuji address in this repository is legacy and must not be passed off as a
canonical or interoperable registry.

## CLI

```bash
npm run build --workspace @avax-impact/sdk
node packages/sdk/dist/src/cli.js encode --calldata 0x... --code avax-impact
node packages/sdk/dist/src/cli.js encode --calldata 0x... --code avax-impact \
  --registry 0x... --registry-chain-id 43113
node packages/sdk/dist/src/cli.js decode --calldata 0x...
node packages/sdk/dist/src/cli.js decode-tx --rpc https://... --hash 0x... --chain-id 43113 --confirmed
node packages/sdk/dist/src/cli.js resolve --rpc https://... --registry 0x... \
  --code avax-impact --kind standard
node packages/sdk/dist/src/cli.js preflight --rpc https://... --to 0x... \
  --calldata 0x... --code avax-impact --from 0x... --value 0x0 \
  --registry 0x... --registry-chain-id 43113 --block-tag 0x... \
  --fallback-policy revert-only
```

CLI `encode` emits schema 1 when `--registry` and `--registry-chain-id` are supplied
together; without them it emits legacy schema 0. `resolve` defaults to the standard
reader and accepts `--kind legacy` only for the historical AVAX Impact registry.

## Verification

```bash
npm run test:sdk
```

Verified locally on 2026-08-28: 49 tests pass, covering schema 0/schema 1 codec rules,
conformance vectors, pinned-block dual-call comparison and fallback, JSON-RPC
validation, transaction fetch/decode, confirmed receipts, ERC-5792 capability handoff,
the pinned registry ABI, the legacy registry resolver, and CLI workflows.

The standard test command enforces minimum SDK coverage of 85% lines, 70% branches,
and 95% functions across compiled source files.

## Trust model

A decoded suffix proves only that the transaction declares builder codes and registry
context. Codes are public and spoofable; neither schema nor registry ownership proves
that the registered builder created or authorized a transaction. Do not use the result
alone for authorization, payments, rewards, or grants. The package is unaudited and
unpublished, and there are no documented third-party adopters yet.
