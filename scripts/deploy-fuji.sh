#!/usr/bin/env bash
set -euo pipefail

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

require_env FUJI_RPC_URL
require_env DEPLOYER_PRIVATE_KEY

expected_chain_id="${EXPECTED_CHAIN_ID:-43113}"
actual_chain_id="$(cast chain-id --rpc-url "$FUJI_RPC_URL")"
if [[ "$actual_chain_id" != "$expected_chain_id" ]]; then
  echo "Refusing to deploy: expected chain $expected_chain_id, RPC reports $actual_chain_id." >&2
  exit 1
fi

forge script contracts/script/DeployFujiCandidate.s.sol:DeployFujiCandidate \
  --rpc-url "$FUJI_RPC_URL" \
  --broadcast \
  --slow

echo "Fuji candidate deployment complete. Copy the three contract addresses from the receipt into .env."
