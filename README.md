# AVAX Impact

[![CI](https://github.com/0xArayy/avax-impact/actions/workflows/ci.yml/badge.svg)](https://github.com/0xArayy/avax-impact/actions/workflows/ci.yml)

ERC-8021-compatible builder attribution for Avalanche C-Chain and EVM-based
Avalanche L1s.

AVAX Impact appends a compact builder code to transaction calldata without changing the
target function ABI. The SDK can recover the attribution from a confirmed transaction,
while a public registry maps builder codes to payout addresses and metadata.

[Try the live Fuji transaction decoder](https://avax-impact.0xarayy.workers.dev).

## MVP

- Solidity builder registry with no custody or execution-path dependency.
- TypeScript encoder, decoder, validator, CLI, and RPC transaction decoder.
- Exact `eth_call` simulation with automatic fallback to original calldata.
- Compatible and deliberately incompatible calldata demo contracts.
- Reproducible Fuji deployment and automated Solidity/TypeScript tests.

## How it works

```text
function calldata + builder code + ERC-8021 suffix
                         |
                  exact eth_call
                   /           \
            compatible       rejected
                |                |
       attributed calldata  original calldata
                |
       decoder + registry lookup
```

Attribution identifies the app, wallet, bot, or backend that declares it generated a
transaction. It does not identify the protocol contract being called and is not proof
that the registered builder authorized the transaction.

## Quick start

Requirements: Node.js 22+, npm, and Foundry.

```bash
npm install
npm test
```

The test suite currently includes 13 TypeScript tests and 11 Solidity tests.

## SDK

```ts
import {
  appendAttribution,
  decodeAttribution,
  prepareAttributedCall,
} from "@avax-impact/sdk";

const calldata = "0x1234";
const attributed = appendAttribution(calldata, ["avax-impact"]);
const decoded = decodeAttribution(attributed);

console.log(decoded.codes); // ["avax-impact"]
console.log(decoded.originalCalldata); // "0x1234"

const prepared = await prepareAttributedCall({
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  to: "0x0000000000000000000000000000000000000001",
  calldata,
  codes: ["avax-impact"],
});

// Attributed calldata when the exact call succeeds; original calldata otherwise.
console.log(prepared.selectedCalldata);
```

See [the SDK documentation](packages/sdk/README.md) for CLI commands and the safe
dry-run flow.

## Live on Fuji

Network: Avalanche Fuji C-Chain (`43113`). Builder code: `avax-impact`.

| Contract | Address |
| --- | --- |
| BuilderRegistry | [`0x8f13…549F`](https://build.avax.network/explorer/fuji/c-chain/address/0x8f13a300f2773EB6fa071B9196f6e16129F2549F) |
| AttributionDemo | [`0x4e08…7200`](https://build.avax.network/explorer/fuji/c-chain/address/0x4e0803c679Fff7F3781856b41C2A810E76c47200) |
| StrictCalldataDemo | [`0x8545…bf8E`](https://build.avax.network/explorer/fuji/c-chain/address/0x854595b7260f1325f643dd732F926c6B5da3bf8E) |

Attributed demo transaction:
[`0x33c0…0821`](https://testnet.snowtrace.io/tx/0x33c0fb7ee4f48276dd237d67c4f8186b2416d2a033a90068d12efed63c8f0821).

The SDK decoded the transaction from Fuji RPC and recovered the original `ping(41)`
calldata. Addresses, transaction hashes, blocks, and verification details are recorded
in the [public deployment manifest](deployments/fuji.json).

## Repository layout

```text
contracts/       Registry, demo contracts, Foundry tests, deployment scripts
packages/sdk/    TypeScript library, CLI, and tests
demo/            Public transaction and calldata decoder
scripts/         Reproducible Fuji deployment and demo flow
deployments/     Public deployment manifests
docs/            Attribution format and Fuji runbook
```

## Compatibility and security

- Extra calldata works with standard Solidity ABI decoding but is not universally safe.
- Contracts that inspect `msg.data.length` or use custom decoders may reject the suffix.
- `prepareAttributedCall` simulates the exact payload and falls back safely.
- Builder codes are public and copyable; never use attribution for authorization,
  payments, or other security decisions.
- The contracts have not received an external security audit.

See the [attribution format](docs/attribution-format.md) and
[Fuji runbook](docs/fuji-runbook.md) for technical details.

## License

[MIT](LICENSE).
