#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
package_stage="$(mktemp -d)"
trap 'rm -rf "$package_stage"' EXIT
export npm_config_cache="$package_stage/npm-cache"

cd "$project_root"
npm run build --workspace @avax-impact/sdk
npm pack --workspace @avax-impact/sdk --pack-destination "$package_stage"

package_tarball="$(find "$package_stage" -maxdepth 1 -name '*.tgz' -print -quit)"
test -n "$package_tarball"

mkdir "$package_stage/consumer"
cd "$package_stage/consumer"
npm init --yes >/dev/null
npm install --ignore-scripts --no-audit --no-fund "$package_tarball" >/dev/null
node --input-type=module --eval \
  'import { appendAttribution, createDataSuffixCapability } from "@avax-impact/sdk";
   const encoded = appendAttribution("0x1234", ["avax-impact"]);
   const capability = createDataSuffixCapability({ codes: ["avax-impact"] });
   if (!encoded.endsWith(capability.dataSuffix.value.slice(2))) process.exit(1);'
cli_output="$(./node_modules/.bin/avax-impact validate --code avax-impact)"
[[ "$cli_output" == *'"valid": true'* ]]
