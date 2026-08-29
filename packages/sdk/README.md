# @avax-impact/sdk

Transaction attribution helpers for Avalanche, evaluated against the ERC-8021 schema 1
draft pinned at commit
[`457532f5c064a4619868ee5e4950f0cc32a7917e`](https://github.com/ilikesymmetry/ERCs/blob/457532f5c064a4619868ee5e4950f0cc32a7917e/ERCS/erc-8021.md).

ERC-8021 is not finalized. `ATTRIBUTION_FORMAT_VERSION` exposes the exact revision this
package implements.

## Install status

The package passes a clean packed-consumer test. npm publication is pending registry
credentials. The current immutable artifact is
[`avax-impact-sdk-0.1.1.tgz`](https://github.com/0xArayy/avax-impact/releases/download/v0.1.1/avax-impact-sdk-0.1.1.tgz)
from release [`v0.1.1`](https://github.com/0xArayy/avax-impact/releases/tag/v0.1.1),
with SHA-256
`194be1b0469271060ca6ee02dae2495ab516161d3736c07c4718972a864d8af8`.

## Encode and decode

Schema 1 is the only format exposed by the default encoder:

```ts
import {
  appendAttribution,
  ATTRIBUTION_FORMAT_VERSION,
  decodeAttribution,
} from "@avax-impact/sdk";

const attributed = appendAttribution("0x1234", {
  registryAddress: "0x96951d7e43812474Bb4AF211dcCAd13080D44653",
  registryChainId: 43113n,
  codes: ["avax-impact"],
});

const decoded = decodeAttribution(attributed);
console.log(ATTRIBUTION_FORMAT_VERSION);
console.log(decoded.schemaId); // 1
console.log(decoded.registryChainId); // 43113n
```

`appendAttributionV1` and `encodeAttributionV1` remain deprecated aliases for migrations.
Registry-less schema 0 reproduction helpers are isolated under
`@avax-impact/sdk/legacy` and are never chosen implicitly.

## Pinned-block preflight

`prepareAttributedCall` requires registry context, pins one block, runs the untouched and
attributed calls with identical sender/value context, and compares return data:

```ts
import { prepareAttributedCall } from "@avax-impact/sdk";

const prepared = await prepareAttributedCall({
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  to: "0xbDe66e5Ae9651C24173CC3DEFc5a4d5D7a186639",
  calldata: "0x773acdef0000000000000000000000000000000000000000000000000000000000000029",
  codes: ["avax-impact"],
  registryAddress: "0x96951d7e43812474Bb4AF211dcCAd13080D44653",
  registryChainId: 43113n,
  value: "0x0",
  fallbackPolicy: "never",
});

if (prepared.status !== "attributed") {
  throw new Error(`handoff blocked: ${prepared.failureKind}`);
}
sendTransaction({ to: "0xbDe6...", data: prepared.selectedCalldata });
```

Policies:

- `revert-only` is the default and selects the already-tested original calldata only
  after an attributed-only recognized execution revert;
- `never` blocks on every attributed-call failure;
- infrastructure, baseline, malformed-result, and return-data-mismatch failures always
  return `status: "blocked"` with `selectedCalldata: null`.

Equal return data is point-in-time evidence. It cannot prove equal writes, logs, gas, or
future inclusion-state execution.

## Wallet batch handoff

For wallets implementing ERC-5792 `wallet_sendCalls`:

```ts
import { createDataSuffixCapability } from "@avax-impact/sdk";

const capabilities = createDataSuffixCapability({
  codes: ["avax-impact"],
  registryAddress: "0x96951d7e43812474Bb4AF211dcCAd13080D44653",
  registryChainId: 43113n,
});
```

This lets the wallet append the suffix. It does not claim universal wallet support or
direct ERC-4337 user-operation decoding.

## Confirmed transactions and registry reads

```ts
import { analyzeConfirmedTransaction, resolveCodeRegistry } from "@avax-impact/sdk";

const analysis = await analyzeConfirmedTransaction({
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  transactionHash: "0x2e826a5bf4ff5c4058618d4a432ed925c86b79055cd03a0f4b7309f2faf03530",
  expectedChainId: 43113,
});

const resolution = await resolveCodeRegistry({
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  registryAddress: "0x96951d7e43812474Bb4AF211dcCAd13080D44653",
  code: "avax-impact",
});
```

`analyzeConfirmedTransaction` rejects pending transactions, failed execution, and
missing or inconsistent receipts. `resolveCodeRegistry` reads the four ABI methods
pinned by the draft: `payoutAddress`, `codeURI`, `isValidCode`, and `isRegistered`.

## CLI

```bash
npm run build --workspace @avax-impact/sdk

avax-impact encode --calldata 0x... --code avax-impact \
  --registry 0x... --registry-chain-id 43113
avax-impact decode --calldata 0x...
avax-impact decode-tx --rpc https://... --hash 0x... --chain-id 43113 --confirmed
avax-impact resolve --rpc https://... --registry 0x... --code avax-impact
avax-impact preflight --rpc https://... --to 0x... --calldata 0x... \
  --code avax-impact --registry 0x... --registry-chain-id 43113 \
  --fallback-policy never
```

Historical operations are explicit: `encode-legacy`, `resolve-legacy`, and the
`@avax-impact/sdk/legacy` subpath.

## Verification

```bash
npm run test:sdk
npm run verify:package
npm run verify:fuji:schema1
npm run verify:compatibility
```

The test suite enforces at least 85% line, 70% branch, and 95% function coverage. The
package test packs the exact artifact, installs it in a clean temporary consumer, and
checks both the default and isolated legacy export paths.

## Trust model

A decoded suffix proves only that a transaction declares codes and registry context.
Codes are public and spoofable. Do not use attribution alone for authorization,
payments, rewards, identity, or grant allocation. The contracts are unaudited, and
external compatibility cases do not imply protocol endorsement or adoption.
