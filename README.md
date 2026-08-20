# AVAX Impact

AVAX Impact is an open, ERC-8021-compatible builder-attribution layer for Avalanche
C-Chain and EVM-based Avalanche L1s. It lets an app attach a small builder code to a
transaction without changing the target function's ABI, then recover that attribution
from the confirmed transaction calldata.

This repository contains a working grant-demo MVP:

- a non-custodial Solidity builder registry;
- compatible and intentionally incompatible calldata demo contracts;
- a dependency-free TypeScript encoder, decoder, validator, and CLI;
- an `eth_call` compatibility check with fail-safe fallback to original calldata;
- Foundry deployment and builder-registration scripts for Fuji;
- automated Solidity and TypeScript tests.

AVAX Impact identifies the app, wallet, bot, or backend that declares it generated a
transaction. That is different from identifying the protocol contract being called.

## How it works

```text
normal function calldata
        +
builder codes | byte length | schema 0 | ERC-8021 marker
        |
        v
exact eth_call simulation
   | compatible             | rejected
   v                        v
send attributed call        send original call
        |
        v
independent decoder + onchain registry lookup
```

The registry never handles user funds and is not consulted during target-contract
execution. Attribution is metadata, not authorization or cryptographic proof of origin.

## Local quick start

Requirements: Node.js 22+, npm, and Foundry.

```bash
npm install
npm test
```

`npm test` builds the SDK and runs 13 SDK tests plus 11 Solidity tests. Foundry runs in
offline mode locally so the repository remains reproducible once Solidity 0.8.24 is
installed.

Encode and decode a call with the CLI:

```bash
npm run build --workspace @avax-impact/sdk

node packages/sdk/dist/src/cli.js encode \
  --calldata 0x1234 \
  --code avax-impact

node packages/sdk/dist/src/cli.js decode \
  --calldata 0x1234617661782d696d706163740b0080218021802180218021802180218021
```

The decoded result returns the builder code, schema, suffix size, and the original
`0x1234` calldata byte-for-byte.

## SDK example

```ts
import { appendAttribution, decodeAttribution } from "@avax-impact/sdk";

const calldata = "0x1234";
const attributed = appendAttribution(calldata, ["avax-impact"]);
const result = decodeAttribution(attributed);

console.log(result.codes); // ["avax-impact"]
console.log(result.originalCalldata); // "0x1234"
```

See [the SDK documentation](packages/sdk/README.md) for the safe dry-run flow.

## Fuji demo

No private key is included and no deployment is claimed until an address and transaction
receipt are committed to `deployments/fuji.json`.

1. Copy `.env.example` to `.env` and use a dedicated, low-value Fuji account.
2. Get test AVAX for that address.
3. Export the values from `.env` into your shell.
4. Deploy, copy the emitted addresses back into `.env`, register the code, and send the
   attributed demo call.

```bash
set -a
source .env
set +a

./scripts/deploy-fuji.sh
./scripts/register-builder.sh
./scripts/send-attributed-ping.sh
```

Detailed expected evidence and verification commands are in the
[Fuji runbook](docs/fuji-runbook.md).

## Repository layout

```text
contracts/src/       Builder registry and compatibility demo contracts
contracts/test/      Foundry unit and compatibility tests
contracts/script/    Reproducible deployment and registration scripts
packages/sdk/        TypeScript library, CLI, and unit tests
scripts/             One-command Fuji demo flow
deployments/         Public deployment records (no secrets)
docs/grant/          Team1 application package and research evidence
```

## Compatibility and trust boundaries

- Extra calldata works with normal Solidity ABI decoding but is not universally safe.
- Contracts that inspect `msg.data.length` or use custom decoders can reject the suffix.
- `prepareAttributedCall` simulates the exact payload and selects original calldata if
  the attributed payload fails.
- Anyone can copy a public builder code. The MVP reports declared attribution; it must
  not be used for permissions, payments, or security decisions.
- The contracts have not received an external security audit.

The byte-level format is specified in [docs/attribution-format.md](docs/attribution-format.md).

## Grant package

- [Application answer bank](docs/grant/application.md)
- [One-page proposal](docs/grant/one-pager.md)
- [Technical specification](docs/grant/technical-spec.md)
- [Milestones and budget](docs/grant/milestones-budget.md)
- [Research and evidence](docs/grant/research-evidence.md)
- [Submission checklist](docs/grant/submission-checklist.md)

## Applicant

[0xArayy](https://github.com/0xArayy), Armenia — solo, full-time blockchain
developer with more than four years of commercial Web3 experience. Experience includes
Avalanche L1 validator/node backend components for CX Chain and cross-chain communication
through Avalanche ICM.

## License

[MIT](LICENSE). No token is planned.
