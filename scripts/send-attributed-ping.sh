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
  REGISTRY_ADDRESS \
  ATTRIBUTION_DEMO_ADDRESS \
  BUILDER_CODE
do
  require_env "$variable"
done

require_nonzero_address ATTRIBUTION_DEMO_ADDRESS
require_nonzero_address REGISTRY_ADDRESS

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
preflight_json="$(node packages/sdk/dist/src/cli.js preflight \
  --rpc "$FUJI_RPC_URL" \
  --to "$ATTRIBUTION_DEMO_ADDRESS" \
  --calldata "$base_calldata" \
  --code "$BUILDER_CODE" \
  --registry "$REGISTRY_ADDRESS" \
  --registry-chain-id "$actual_chain_id" \
  --fallback-policy never)"

if [[ "$(jq -r '.status' <<<"$preflight_json")" != "attributed" ]]; then
  echo "Refusing to sign: schema 1 preflight did not establish matching return data." >&2
  jq '{status, failureKind, failedStage, error, blockTag}' <<<"$preflight_json" >&2
  exit 1
fi

attributed_calldata="$(jq -er '.selectedCalldata' <<<"$preflight_json")"

cast send "$ATTRIBUTION_DEMO_ADDRESS" "$attributed_calldata" \
  --gas-limit "${DEMO_GAS_LIMIT:-100000}" \
  --rpc-url "$FUJI_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY"
