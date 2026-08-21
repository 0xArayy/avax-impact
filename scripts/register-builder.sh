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
  BUILDER_CODE \
  PAYOUT_ADDRESS \
  METADATA_URI
do
  require_env "$variable"
done

require_nonzero_address REGISTRY_ADDRESS
require_nonzero_address PAYOUT_ADDRESS

expected_chain_id="${EXPECTED_CHAIN_ID:-43113}"
actual_chain_id="$(cast chain-id --rpc-url "$FUJI_RPC_URL")"
if [[ "$actual_chain_id" != "$expected_chain_id" ]]; then
  echo "Refusing to register: expected chain $expected_chain_id, RPC reports $actual_chain_id." >&2
  exit 1
fi

forge script contracts/script/RegisterBuilder.s.sol:RegisterBuilder \
  --rpc-url "$FUJI_RPC_URL" \
  --broadcast
