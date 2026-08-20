# Fuji deployment and demo runbook

This runbook produces the evidence needed for the Team1 application: a public registry,
an attributed transaction, and a decoder output that recovers its original calldata.

## 1. Prepare a dedicated account

Use a new, low-value Fuji-only key. Fund it with test AVAX. Never reuse a mainnet key and
never commit `.env`, shell history containing the key, or an authenticated RPC URL.

```bash
cp .env.example .env
```

Set `DEPLOYER_PRIVATE_KEY`, `PAYOUT_ADDRESS`, and any custom RPC URL in `.env`, then load
the variables:

```bash
set -a
source .env
set +a
```

## 2. Verify locally

```bash
npm install
npm test
bash -n scripts/*.sh
```

## 3. Deploy contracts

```bash
./scripts/deploy-fuji.sh
```

The Foundry receipt contains three addresses:

- `BuilderRegistry`;
- `AttributionDemo`, which accepts trailing attribution;
- `StrictCalldataDemo`, which deliberately rejects it.

Copy them to the corresponding `.env` fields and export the updated values again.
All three broadcast scripts refuse to run unless the RPC reports Fuji chain ID `43113`.
For a local Anvil rehearsal only, set `EXPECTED_CHAIN_ID=31337` explicitly.

## 4. Register `avax-impact`

```bash
./scripts/register-builder.sh

cast call "$REGISTRY_ADDRESS" \
  'isRegistered(string)(bool)' "$BUILDER_CODE" \
  --rpc-url "$FUJI_RPC_URL"
```

Expected result: `true`.

## 5. Send an attributed call

```bash
./scripts/send-attributed-ping.sh
```

The script:

1. ABI-encodes `ping(41)`;
2. appends the configured builder code with the SDK;
3. simulates the exact attributed payload via `eth_call`;
4. broadcasts only after the simulation succeeds.

Save the printed transaction hash and decode it directly from Fuji:

```bash
node packages/sdk/dist/src/cli.js decode-tx \
  --rpc "$FUJI_RPC_URL" \
  --hash 0xYOUR_TRANSACTION_HASH
```

The output must show `avax-impact` and the original 36-byte `ping(uint256)` calldata.

## 6. Record reproducible evidence

Create `deployments/fuji.json` containing only public information:

```json
{
  "chainId": 43113,
  "deployer": "0x...",
  "blockNumber": 0,
  "deployedAt": "2026-08-20T00:00:00Z",
  "commit": "...",
  "contracts": {
    "builderRegistry": "0x...",
    "attributionDemo": "0x...",
    "strictCalldataDemo": "0x..."
  },
  "transactions": {
    "deployment": ["0x..."],
    "registration": "0x...",
    "attributedPing": "0x..."
  }
}
```

Before publishing, verify all addresses and hashes against an Avalanche explorer and make
sure the file contains no credentials.
