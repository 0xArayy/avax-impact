# AVAX Impact Attribution Readiness Workbench

Read-only browser workbench for AVAX Impact attribution on Avalanche Fuji.

Production: [avax-impact.0xarayy.workers.dev](https://avax-impact.0xarayy.workers.dev)

The workbench has two production paths:

- **Inspect:** a Fuji C-Chain transaction hash through the SDK's
  `analyzeTransaction`, or raw attributed calldata decoded locally by the same SDK.
- **Preflight:** the SDK's `prepareAttributedCall` appends schema 0 attribution and
  runs the exact attributed payload through `eth_call`. If the target rejects trailing
  calldata, the UI exposes the untouched original calldata as the safe fallback.

Schema 0 is explicitly presented as the current **legacy wire-format prototype**.
Builder codes are resolved through the AVAX Impact Fuji extension
`resolveLegacyBuilder`; this must not be confused with a finalized ERC-8021 registry ABI.

Raw schema 1 payloads show the registry chain embedded in the suffix and never inherit
Fuji provenance from the page. Pending transactions are shown as unconfirmed.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Validation commands:

```bash
npx tsc --noEmit
npm run lint
npm test
```

`npm test` creates a production build, runs render checks, and tests validation,
chain-provenance, pending-block, and safe-fallback presentation logic.

## Cloudflare deployment

Authenticate once with `npx wrangler login`, then deploy the configured Worker:

```bash
npm run deploy:cloudflare
```

The demo has no database, authentication, wallet connection, private-key input, or
transaction write path. RPC access is limited to public read-only methods. Preflight
output must be handed off to the user's own trusted signer.
