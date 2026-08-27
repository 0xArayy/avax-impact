# Acceptance matrix

Assessment date: **2026-08-27**. “Pass locally” means verified in this checkout.
“Recorded live pass” means the deployment manifest records a successful live check and
the repository provides the command to repeat it. External adoption and security review
require evidence outside this repository and are not inferred from code.

## Current repository acceptance

| ID | Criterion | Status | Evidence | Remaining condition |
| --- | --- | --- | --- | --- |
| DRAFT-1 | Identify the exact upstream draft | Pass locally | `ATTRIBUTION_FORMAT_VERSION` pins `erc-8021@457532f5c064a4619868ee5e4950f0cc32a7917e`; docs use the immutable upstream permalink | Re-pin only through an explicit versioned migration |
| FORMAT-1 | Encode/decode the pinned schema 1 format | Pass locally | Pinned upstream example round-trips; registry address and chain ID are validated; shared vectors run in the SDK suite | Add a second independent implementation consuming the same fixtures |
| FORMAT-2 | Preserve and label the schema 0 prototype | Pass locally | `LEGACY_FORMAT_VERSION`, schema 0 codec tests, malformed vectors, a repeated/one-byte code policy vector, and the recorded Fuji transaction | Keep schema 0 labeled legacy; do not imply registry interoperability |
| REG-1 | Implement the pinned `ICodeRegistry` read ABI locally | Pass locally | Solidity selectors and lifecycle behavior are tested, including fuzz coverage; SDK `resolveCodeRegistry` tests all four reads | Deploy and verify this current registry on Fuji |
| REG-2 | Preserve the AVAX Impact lifecycle extension without confusing it with the standard ABI | Pass locally | `resolve` and `resolveLegacyBuilder` are explicitly named legacy/extension paths | Keep standard and legacy results distinct in every consumer |
| SAFE-1 | Simulate the exact attributed call and fall back to original calldata | Pass against mocked RPC | Tests cover success, sender/value/schema 1 context, revert, transport failure, malformed input, and incomplete registry context | Add live-node/fork coverage; simulation still cannot guarantee future state |
| TX-1 | Fetch, chain-check, classify, and decode a transaction | Pass against mocked RPC | `analyzeTransaction` and CLI `decode-tx --chain-id` cover declared, unattributed, malformed, missing, wrong-network, and malformed RPC cases | API permits pending `blockNumber: null`; require a successful receipt when confirmation matters and maintain a live canary |
| CLI-1 | Expose schema 0/schema 1 encode, decode, resolve, and preflight workflows | Pass locally | CLI tests cover help surface, schema 1 JSON output, and partial-context rejection | Publish the package/release and add a clean external consumer test |
| QA-1 | Core SDK and contract suites pass | Pass locally | `npm run test:sdk`: 33/33; `npm run test:contracts`: 18/18 on 2026-08-27 | Do not infer demo counts from this row; `npm run check` owns repository-wide QA |
| QA-2 | Aggregate build/test/lint/format/shell check exists | Pass locally | `npm run check` passed on 2026-08-27 and runs core tests, demo test/lint, `forge fmt --check`, and `bash -n scripts/*.sh`; CI mirrors these surfaces | Rerun from a clean checkout before submission |
| QA-3 | Locked JavaScript dependencies have no known npm advisories | Pass locally | `npm audit --audit-level=high` returned `0 vulnerabilities` for both root and `demo` graphs on 2026-08-27 after compatible React/Vite/vinext/Cloudflare updates | Advisory databases change; retain automated auditing and rerun before release |
| DEMO-1 | Web workbench consumes the shared SDK without decoder drift | Pass locally | `demo` depends on `file:../packages/sdk`; Inspect, registry resolution, and Preflight import SDK APIs; the former copied `demo/lib/attribution.ts` is removed | Keep the demo build after the SDK build in CI |
| DEMO-2 | Inspect works against real Fuji data and preserves provenance | Live browser pass | gstack browser fetched tx `0x33c0…0821`, decoded `avax-impact`, showed block `57,881,798`, and resolved the active legacy record; pinned schema 1 raw fixture showed embedded registry chain `8453`, not Fuji | Public RPC availability remains external; scheduled verifier covers the sample evidence |
| DEMO-3 | Preflight demonstrates both compatibility and safe fallback | Live browser pass | Compatible legacy-registry sample selected attributed calldata; live `StrictCalldataDemo` sample reverted and selected the byte-identical original `strictPing(41)` calldata | `eth_call` remains a point-in-time compatibility check, not an inclusion guarantee |
| UX-1 | Core states, accessibility, and responsive layout are usable | Browser-tested in production | 10 demo tests cover strict-sample identity, full sample recovery, validation, presentation, SSR, and the production handler without an unused Images binding; the production Worker was exercised at desktop and 390×844; labels, skip link, live regions, focus styles, 42px+ controls, no horizontal overflow, and a clean console were inspected | A formal third-party WCAG audit and automated scheduled production canary are not claimed |
| PROV-1 | Historical Fuji deployment has reachable, reproducible source | Pass locally | Commit `0c0665124ed8f1edc5372ed48c77a92a941d08be` exists and predates deployment; `verify:fuji` rebuilds it and compares recorded bytecode hashes | Preserve the commit and immutable URL in public history |
| FUJI-1 | Historical contracts, receipts, legacy registry state, schema 0 transaction, and strict negative path are automatically checked | Live pass; repeatable | Manifest records `reverifiedAt: 2026-08-27T08:05:43Z`; `npm run verify:fuji` passed against public Fuji and checks chain ID, live bytecode, all receipts, legacy record, attributed tx, original `strictPing(41)` success, and attributed `UnexpectedCalldataLength(65)` revert | Rerun at grant submission time to detect later RPC or chain drift |
| FUJI-2 | A conformant `ICodeRegistry` registry and schema 1 proof exist on Fuji | Not delivered | Local implementation and tests only; historical address predates the pinned ABI | New deployment, schema 1 transaction, versioned manifest, and live verifier proof are Milestone 1 |
| TRUST-1 | Public surfaces state attribution is a declaration, not authentication | Pass in docs | README, SDK README, format doc, application, and product docs disclose copyability/spoofing | Keep the warning adjacent to registry, payout, analytics, and reward output |
| RELEASE-1 | SDK is installable from npm | Not delivered | Workspace package builds; README explicitly says unpublished | Publish an immutable version and prove install/import/CLI from a clean consumer |
| SEC-1 | Contracts/SDK have independent security assurance | Not delivered | Unit/fuzz tests exist, but no external audit is claimed | Targeted independent review; resolve high severity findings before mainnet recommendation |
| VALID-1 | External interviews/adopters/pilots demonstrate demand | No evidence yet | Market-validation document explicitly records zero interviews/adopters | Complete documented discovery and external Fuji pilots; self-generated transactions do not count |

## Milestone 1 acceptance gate

Milestone 1 is complete only when all of the following public evidence exists:

1. The package/release identifies draft commit `457532f5…` and publishes schema 0 and
   schema 1 fixtures used by at least two independent implementations.
2. A new Fuji registry is deployed from a reachable commit and all four pinned
   `ICodeRegistry` views pass read-only checks for valid, invalid, registered,
   unregistered, and inactive cases.
3. A confirmed schema 1 Fuji transaction embeds the new registry address and chain ID
   `43113`, preserves the original calldata, and resolves the declared code through the
   pinned ABI.
4. A versioned manifest records compiler settings, source permalink, runtime hashes,
   transactions, blocks, and decoded fields.
5. One automated command rebuilds the deployment source and checks live bytecode,
   receipts, registry behavior, and the schema 1 transaction with nonzero exit on drift.
6. Two independent developers complete the public quickstart. Their evidence is
   external validation, not another maintainer-run test.

## Non-negotiable limitations

- Codes are public and spoofable; attribution alone cannot authorize or pay anyone.
- The existing Fuji deployment is a schema 0 wire-format prototype with the legacy AVAX
  Impact registry. It is not the Milestone 1 conformant deployment.
- The SDK is unpublished, the contracts are unaudited, and the repository documents no
  external adopters or interviews as of the assessment date.
