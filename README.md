# AVAX Impact

![AVAX Impact — builder attribution for Avalanche](assets/avax-impact-project-thumbnail.png)

[![CI](https://github.com/0xArayy/avax-impact/actions/workflows/ci.yml/badge.svg)](https://github.com/0xArayy/avax-impact/actions/workflows/ci.yml)

Builder attribution infrastructure for Avalanche C-Chain and EVM-based Avalanche L1s.

AVAX Impact appends a compact public builder declaration to transaction calldata. The
SDK embeds an explicit registry address and chain ID, compares the untouched and
attributed calls at one pinned block, and refuses transaction handoff when the result is
inconclusive.

[Open the live Fuji explorer and preflight](https://avax-impact.0xarayy.workers.dev).

## Live schema 1 evidence

Network: Avalanche Fuji C-Chain (`43113`). Builder code: `avax-impact`.

| Evidence | Public reference |
| --- | --- |
| Pinned `ICodeRegistry` deployment | [`0x9695…4653`](https://build.avax.network/explorer/fuji/c-chain/address/0x96951d7e43812474Bb4AF211dcCAd13080D44653) |
| Compatible calldata demo | [`0xbDe6…6639`](https://build.avax.network/explorer/fuji/c-chain/address/0xbDe66e5Ae9651C24173CC3DEFc5a4d5D7a186639) |
| Strict-calldata negative control | [`0x7524…D005`](https://build.avax.network/explorer/fuji/c-chain/address/0x752495F1423edE0606329fCC7bFC0B18FE3DD005) |
| Confirmed schema 1 transaction | [`0x2e82…3530`](https://build.avax.network/explorer/fuji/c-chain/tx/0x2e826a5bf4ff5c4058618d4a432ed925c86b79055cd03a0f4b7309f2faf03530) |
| Versioned deployment manifest | [`deployments/fuji-schema1.json`](deployments/fuji-schema1.json) |
| Immutable deployment source | [`fuji-schema1-v0.1.0`](https://github.com/0xArayy/avax-impact/tree/fuji-schema1-v0.1.0) |
| Immutable SDK release | [`v0.1.1`](https://github.com/0xArayy/avax-impact/releases/tag/v0.1.1) |

Reproduce the evidence from source and public RPC data:

```bash
npm ci
npm run verify:fuji:schema1
npm run verify:compatibility
```

The verifier rebuilds the tagged deployment source, compares live runtime bytecode,
checks every receipt and registry read, decodes the confirmed schema 1 transaction, and
exercises the strict rejection path. The compatibility corpus also runs live read-only
cases against Aave V3, LFJ, Circle USDC, BENQI, and Chainlink on C-Chain.

## Standards status

ERC-8021 is a draft, not a finalized ERC. This repository evaluates the schema 1 format
from immutable upstream commit
[`457532f5c064a4619868ee5e4950f0cc32a7917e`](https://github.com/ilikesymmetry/ERCs/blob/457532f5c064a4619868ee5e4950f0cc32a7917e/ERCS/erc-8021.md).

The default SDK and CLI surface requires schema 1 registry context. Historical schema 0
decoding and reproduction helpers are isolated under `@avax-impact/sdk/legacy`; they are
not selected implicitly by any transaction-preparation API.

## Safety model

```text
pin one block → original eth_call succeeds
                         |
                  attributed eth_call
                /          |           \
       same return data   revert    mismatch / RPC error
              |              |              |
    attributed calldata  tested original   handoff blocked
                           fallback
```

The default `revert-only` policy permits fallback only after the original call succeeds
and the attributed call produces a recognized execution revert. `never` disables all
fallback. Transport, timeout, malformed-response, baseline, and return-data-mismatch
failures expose no selected calldata.

Matching `eth_call` return data is point-in-time compatibility evidence. It does not
prove equal storage writes, events, gas, later execution, identity, or authorization.

## Quick start

Requirements: Node.js 22.13+, npm, and Foundry. CI pins Forge 1.2.3.

```bash
npm ci
npm --prefix demo ci
npm run check
```

Encode schema 1 attribution:

```ts
import { appendAttribution, decodeAttribution } from "@avax-impact/sdk";

const attributed = appendAttribution("0x1234", {
  registryAddress: "0x96951d7e43812474Bb4AF211dcCAd13080D44653",
  registryChainId: 43113n,
  codes: ["avax-impact"],
});

const declaration = decodeAttribution(attributed);
```

Prepare a transaction safely:

```ts
import { prepareAttributedCall } from "@avax-impact/sdk";

const prepared = await prepareAttributedCall({
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  to: "0xbDe66e5Ae9651C24173CC3DEFc5a4d5D7a186639",
  calldata: "0x773acdef0000000000000000000000000000000000000000000000000000000000000029",
  codes: ["avax-impact"],
  registryAddress: "0x96951d7e43812474Bb4AF211dcCAd13080D44653",
  registryChainId: 43113n,
  fallbackPolicy: "never",
});

if (prepared.status !== "attributed") throw new Error("attribution handoff blocked");
```

See [the SDK guide](packages/sdk/README.md) for the CLI, confirmed transaction analysis,
registry reads, and ERC-5792 wallet capability handoff.

## Repository map

```text
contracts/       Registry, demo contracts, Foundry tests, deployment scripts
packages/sdk/    TypeScript SDK, CLI, legacy evidence subpath, and tests
demo/            Static React explorer and preflight deployed to Cloudflare
fixtures/        Conformance and live compatibility cases
deployments/     Versioned public deployment manifests
scripts/         Deployment, transaction, packaging, and read-only verification
docs/            Grant, protocol, security, product, and operations evidence
```

The [documentation index](docs/README.md) separates grant material, protocol references,
operations, and historical evidence.

## Current limits

- Builder codes and suffixes are public and copyable. Never use them alone for access
  control, payments, rewards, identity, or grant allocation.
- Extra calldata is not universally compatible. Custom decoders and exact-length checks
  can reject it; always preflight the exact call context.
- External corpus results are engineering evidence, not adoption or partner claims.
- Contracts are unaudited and no external adopters or interviews are documented yet.
- The SDK is verified as a packed clean-consumer artifact. npm publication is pending
  registry credentials; releases remain available as immutable GitHub artifacts.

Historical schema 0 evidence remains reproducible in
[its isolated evidence note](docs/legacy-schema0-evidence.md).

## License

[MIT](LICENSE).
