# Fuji verification and deployment runbook

This runbook separates two different artifacts that must not be conflated:

1. the historical schema 0 AVAX Impact prototype already deployed on Fuji; and
2. a future schema 1 deployment using the pinned `ICodeRegistry` ABI.

## Verify the historical deployment

The public addresses and transactions in `deployments/fuji.json` were deployed from
source commit
[`0c0665124ed8f1edc5372ed48c77a92a941d08be`](https://github.com/0xArayy/avax-impact/commit/0c0665124ed8f1edc5372ed48c77a92a941d08be).
That source is now present in Git history and predates the recorded deployment.

Run:

```bash
npm install
npm run verify:fuji
```

`verify:fuji` first builds the current SDK/contracts, then the read-only verifier:

1. confirms the recorded source commit exists;
2. archives and rebuilds that exact commit with the recorded compiler settings;
3. compares rebuilt and live Fuji runtime bytecode lengths and hashes;
4. checks the chain ID and all deployment, registration, and demo receipts;
5. resolves `avax-impact` through the deployed legacy registry ABI;
6. fetches the attributed transaction and verifies target, schema 0 code, and original
   `ping(41)` calldata.

The command requires `git`, Node.js 22+, npm, Foundry/cast, `tar`, and outbound Fuji RPC
access. Set `FUJI_RPC_URL` to override the public endpoint. A mismatch or unreachable RPC
is a failed live verification, not permission to rely on the manifest alone.

The historical result is deliberately narrow: it validates a schema 0 wire-format
prototype and AVAX Impact's legacy registry. It does not validate a canonical or
interoperable ERC-8021 registry.

## Current historical addresses

| Contract | Address |
| --- | --- |
| Legacy `BuilderRegistry` | `0x8f13a300f2773EB6fa071B9196f6e16129F2549F` |
| `AttributionDemo` | `0x4e0803c679Fff7F3781856b41C2A810E76c47200` |
| `StrictCalldataDemo` | `0x854595b7260f1325f643dd732F926c6B5da3bf8E` |

Attributed transaction:
`0x33c0fb7ee4f48276dd237d67c4f8186b2416d2a033a90068d12efed63c8f0821`.

## Rehearse the current contracts locally

Before any new Fuji broadcast:

```bash
npm install
npm test
forge fmt --check
bash -n scripts/*.sh
```

The current local code differs from the historical deploy. It adds schema 1 support in
the SDK and the pinned `ICodeRegistry` read ABI in `BuilderRegistry`. A successful local
test does not upgrade the old Fuji address.

## Prepare a dedicated Fuji account

Use a new, low-value Fuji-only key funded with test AVAX. Never reuse a mainnet key or
commit `.env`, a private key, or an authenticated RPC URL.

```bash
cp .env.example .env
set -a
source .env
set +a
```

Set `DEPLOYER_PRIVATE_KEY`, `PAYOUT_ADDRESS`, `METADATA_URI`, `BUILDER_CODE`, and
`FUJI_RPC_URL`. The shell scripts refuse a chain ID other than `43113` unless
`EXPECTED_CHAIN_ID` is explicitly changed for a local Anvil rehearsal.

## Deploy the current conformant registry candidate

```bash
./scripts/deploy-fuji.sh
```

Record the new `BuilderRegistry`, `AttributionDemo`, and `StrictCalldataDemo` addresses,
then set `REGISTRY_ADDRESS` and `ATTRIBUTION_DEMO_ADDRESS`.

Register the code:

```bash
./scripts/register-builder.sh
```

Verify every pinned read function at the new address:

```text
payoutAddress(string)
codeURI(string)
isValidCode(string)
isRegistered(string)
```

Also test invalid, unknown, and inactive-code behavior. A successful legacy `resolve`
call alone is not sufficient evidence of `ICodeRegistry` conformance.

## Produce a schema 1 Fuji proof

Use `appendAttributionV1` or `prepareAttributedCall` with both the new registry address
and `registryChainId: 43113n`. Provide the real sender and value during simulation. The
confirmed transaction must decode to:

- `schemaId: 1`;
- the exact new registry address;
- registry chain ID `43113`;
- expected builder codes;
- unchanged original target calldata.

The existing `scripts/send-attributed-ping.sh` currently emits legacy schema 0 through
the CLI. It can reproduce the old prototype path but is not evidence for this schema 1
milestone until it is upgraded or a separate schema 1 sender is added.

## Record new deployment evidence

Do not overwrite the historical record without preserving its identity. A new manifest
or versioned manifest should include:

- exact reachable source commit and immutable source URL;
- UTC commit and deployment timestamps;
- Solidity version, optimizer settings, runs, and EVM version;
- every deployment/registration/demo transaction hash, receipt status, and block;
- runtime bytecode length and Keccak hash for each contract;
- new registry address and explicit `ICodeRegistry` conformance status;
- a confirmed schema 1 transaction and decoded registry context;
- verifier version/command and last successful verification time.

Before publishing, run a clean read-only verifier that rebuilds the new source and
checks live bytecode, receipts, registry calls, and the schema 1 transaction. Explorer
links are useful navigation, not a substitute for deterministic checks.

## Operational limits

- The contracts are unaudited.
- First-come registration permits squatting/front-running.
- Builder codes remain public and spoofable even with schema 1.
- Shell scripts pass a Fuji private key to Foundry/cast; prefer a keystore or hardware
  signer before any production operation.
- No new conformant Fuji registry or schema 1 proof is claimed until its manifest and
  verifier evidence are committed publicly.
