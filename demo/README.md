# AVAX Impact demo

Public browser decoder for AVAX Impact attribution on Avalanche Fuji.

Production: [avax-impact.0xarayy.workers.dev](https://avax-impact.0xarayy.workers.dev)

It supports two inputs:

- a Fuji C-Chain transaction hash, resolved through the public Avalanche RPC;
- raw ERC-8021-compatible calldata, decoded entirely in the browser.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Use `npm test` to create a production build and verify the rendered page.

## Cloudflare deployment

Authenticate once with `npx wrangler login`, then deploy the configured Worker:

```bash
npm run deploy:cloudflare
```

The demo has no database, authentication, wallet connection, or write path. It never
requests private keys and does not submit transactions.
