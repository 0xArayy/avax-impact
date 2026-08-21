# @avax-impact/sdk

ERC-8021-compatible builder attribution helpers for Avalanche C-Chain and EVM-based Avalanche L1s.

## Install

```bash
npm install @avax-impact/sdk
```

The package is not published during the MVP. Use the workspace package until the first public release.

## Encode and decode

```ts
import {
  appendAttribution,
  decodeAttribution,
} from "@avax-impact/sdk";

const calldata = "0x773acdef0000000000000000000000000000000000000000000000000000000000000029";
const attributed = appendAttribution(calldata, ["avax-impact"]);
const decoded = decodeAttribution(attributed);

console.log(decoded.codes); // ["avax-impact"]
console.log(decoded.originalCalldata === calldata); // true
```

## Dry-run compatibility

Some contracts reject trailing calldata. Test the attributed call with `eth_call` and fall back to the original calldata when it fails:

```ts
import { prepareAttributedCall } from "@avax-impact/sdk";

const prepared = await prepareAttributedCall({
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  to: "0x0000000000000000000000000000000000000001",
  calldata: "0x...",
  codes: ["avax-impact"],
});

// attributed calldata on success, original calldata on failure
sendTransaction({ to: "0x...", data: prepared.selectedCalldata });
```

## CLI

```bash
npm run build
node dist/src/cli.js encode --calldata 0x... --code avax-impact
node dist/src/cli.js decode --calldata 0x...
node dist/src/cli.js decode-tx --rpc https://... --hash 0x...
```

## Trust model

A decoded suffix proves only that the transaction declares a builder code. Because codes are public, it is not cryptographic proof that the registered builder created or authorized the transaction. The MVP reports declared attribution and does not use it for authorization.
