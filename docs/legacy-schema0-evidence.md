# Historical schema 0 evidence

This page preserves the first AVAX Impact Fuji experiment without exposing it as the
default product path. New integrations must use schema 1 through `@avax-impact/sdk`.

The historical transaction used registry-less schema 0 and a project-specific registry
ABI. It proves that the suffix could be appended and decoded on Fuji; it does not prove
schema 1 registry interoperability.

| Evidence | Reference |
| --- | --- |
| Legacy registry | [`0x8f13…549F`](https://build.avax.network/explorer/fuji/c-chain/address/0x8f13a300f2773EB6fa071B9196f6e16129F2549F) |
| Compatible demo | [`0x4e08…7200`](https://build.avax.network/explorer/fuji/c-chain/address/0x4e0803c679Fff7F3781856b41C2A810E76c47200) |
| Strict demo | [`0x8545…bf8E`](https://build.avax.network/explorer/fuji/c-chain/address/0x854595b7260f1325f643dd732F926c6B5da3bf8E) |
| Schema 0 transaction | [`0x33c0…0821`](https://build.avax.network/explorer/fuji/c-chain/tx/0x33c0fb7ee4f48276dd237d67c4f8186b2416d2a033a90068d12efed63c8f0821) |
| Manifest | [`deployments/fuji.json`](../deployments/fuji.json) |
| Immutable source | [`fuji-schema0-v0.1.0`](https://github.com/0xArayy/avax-impact/tree/fuji-schema0-v0.1.0) |

Reproduce it with:

```bash
npm run verify:fuji
```

Historical write helpers and the extended registry resolver live only in:

```ts
import {
  appendLegacyAttribution,
  encodeLegacyAttribution,
  resolveLegacyBuilder,
} from "@avax-impact/sdk/legacy";
```

The default `encode`, `preflight`, wallet capability, and SDK preparation APIs cannot
select schema 0 implicitly.
