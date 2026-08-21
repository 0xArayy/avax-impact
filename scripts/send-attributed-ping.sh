#!/usr/bin/env bash
set -euo pipefail

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_nonzero_address() {
  local name="$1"
  local value="${!name}"
  if [[ ! "$value" =~ ^0x[0-9a-fA-F]{40}$ ]] || \
     [[ "$value" == "0x0000000000000000000000000000000000000000" ]]; then
    echo "$name must be a non-zero EVM address." >&2
    exit 1
  fi
}

for variable in \
  FUJI_RPC_URL \
  DEPLOYER_PRIVATE_KEY \
  ATTRIBUTION_DEMO_ADDRESS \
  BUILDER_CODE
do
  require_env "$variable"
done

require_nonzero_address ATTRIBUTION_DEMO_ADDRESS

expected_chain_id="${EXPECTED_CHAIN_ID:-43113}"
actual_chain_id="$(cast chain-id --rpc-url "$FUJI_RPC_URL")"
if [[ "$actual_chain_id" != "$expected_chain_id" ]]; then
  echo "Refusing to send: expected chain $expected_chain_id, RPC reports $actual_chain_id." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to read the SDK output." >&2
  exit 1
fi

npm run build --workspace @avax-impact/sdk >/dev/null

base_calldata="$(cast calldata 'ping(uint256)' "${PING_VALUE:-41}")"
attributed_calldata="$({
  node packages/sdk/dist/src/cli.js encode \
    --calldata "$base_calldata" \
    --code "$BUILDER_CODE"
} | jq -r '.calldata')"

# Simulate the exact attributed payload before asking the wallet to sign it.
cast call "$ATTRIBUTION_DEMO_ADDRESS" "$attributed_calldata" \
  --gas-limit "${DEMO_GAS_LIMIT:-100000}" \
  --rpc-url "$FUJI_RPC_URL" >/dev/null

cast send "$ATTRIBUTION_DEMO_ADDRESS" "$attributed_calldata" \
  --gas-limit "${DEMO_GAS_LIMIT:-100000}" \
  --rpc-url "$FUJI_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY"
