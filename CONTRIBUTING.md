# Contributing

Contributions are welcome, especially independent conformance vectors, wallet recipes,
compatibility fixtures, and narrowly scoped security improvements.

## Before opening a change

Open an issue for a new public API, wire-format change, registry lifecycle change, or
new deployment. Small documentation and test corrections can go directly to a pull
request. Never include private keys, funded credentials, or personal interview notes.

## Development gate

Requirements are Node.js 22+, npm, and Foundry 1.2.3-compatible tooling.

```bash
npm ci
npm --prefix demo ci
npm run check
```

Every behavior change must include tests. Format Solidity with `forge fmt`. Keep ERC-8021
claims tied to the pinned draft commit and distinguish the historical schema 0 Fuji
prototype from a conformant schema 1 deployment.

## Pull requests

Describe the problem, trust-boundary impact, tests run, and any deployment or migration
effect. Keep changes reviewable and avoid combining unrelated refactors. A maintainer
review and passing CI are required before merge.
