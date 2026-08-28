# AVAX Impact Explorer & Preflight

Static React application for inspecting and preflighting schema 1 attribution on
Avalanche Fuji.

Production: [avax-impact.0xarayy.workers.dev](https://avax-impact.0xarayy.workers.dev)

- **Inspect** reads a Fuji transaction or decodes raw calldata through the shared SDK.
  The default sample is a confirmed schema 1 transaction tied to the deployed Fuji
  registry.
- **Preflight** pins one block, compares the untouched and schema 1 attributed payloads,
  and exposes calldata only when the SDK policy establishes a safe handoff.
- **Historical evidence** is collapsed and loaded only for an explicitly decoded schema
  0 payload.

The app has no database, wallet connection, signing request, private-key input, or
transaction submission path.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run typecheck
npm run dev
```

Full validation:

```bash
npm test
npm run lint
```

The production build uses stable Vite + React and deploys as static Cloudflare Assets.
There is no beta server-component runtime.

## Cloudflare deployment

```bash
npm run deploy:cloudflare
```

Preflight output must be handed to the user's own trusted signer. A successful
comparison is point-in-time evidence, not a transaction guarantee or identity proof.
