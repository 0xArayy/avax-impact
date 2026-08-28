# Acceptance matrix

Assessment date: **2026-08-28**. “Pass locally” means verified in this checkout.
“Recorded live pass” means the deployment manifest records a successful live check and
the repository provides the command to repeat it. External adoption and security review
require evidence outside this repository and are not inferred from code.

## Current repository acceptance

| ID | Criterion | Status | Evidence | Remaining condition |
| --- | --- | --- | --- | --- |
| DRAFT-1 | Identify the exact upstream draft | Pass locally | `ATTRIBUTION_FORMAT_VERSION` pins `erc-8021@457532f5c064a4619868ee5e4950f0cc32a7917e`; docs use the immutable upstream permalink | Re-pin only through an explicit versioned migration |
| FORMAT-1 | Encode/decode the pinned schema 1 format | Pass locally | Pinned upstream example round-trips; registry address and chain ID are validated; shared vectors run in the SDK suite | Add a second independent implementation consuming the same fixtures |
| FORMAT-2 | Preserve and label the schema 0 prototype | Pass locally | `LEGACY_FORMAT_VERSION`, schema 0 codec tests, malformed vectors, a repeated/one-byte code policy vector, and the recorded Fuji transaction | Keep schema 0 labeled legacy; do not imply registry interoperability |
| REG-1 | Implement and deploy the pinned `ICodeRegistry` read ABI | Live/public pass | Solidity selectors and lifecycle behavior are tested; Fuji registry `0x9695…4653` passes all four SDK reads and reproducible bytecode verification | Maintain the live scheduled verifier; this does not imply an Avalanche-selected registry |
| REG-2 | Preserve the historical lifecycle extension without confusing it with the standard ABI | Pass locally | Standard resolution stays in the default package; `resolveLegacyBuilder` is isolated under `@avax-impact/sdk/legacy` | Keep historical output collapsed and explicitly labeled |
| SAFE-1 | Compare original/attributed calls at one pinned block with an explicit fallback policy | Live and local pass | Tests cover baseline, return match, `revert-only`, `never`, mismatches, and infrastructure failures; the live corpus covers three first-party controls and six external C-Chain calls across Aave, LFJ, Circle, BENQI, and Chainlink | Matching return data cannot prove equal state effects or future execution |
| TX-1 | Fetch, chain-check, classify, decode, and optionally confirm a transaction | Pass against mocked RPC | `analyzeConfirmedTransaction` and CLI `decode-tx --confirmed` reject pending, failed, missing, and inconsistent receipts; inspection API remains explicit | Maintain a live confirmed-transaction canary |
| CLI-1 | Expose schema 1 encode, decode, resolve, and preflight workflows with explicit historical commands | Pass locally | CLI requires registry context for `encode`/`preflight`; `encode-legacy` and `resolve-legacy` cannot be selected accidentally | Publish the package/release; the packed clean-consumer test already covers both export paths |
| QA-1 | Core SDK and contract suites pass with SDK coverage floors | Pass locally | `npm run test:sdk`: 47/47 with ≥85% lines, ≥70% branches, ≥95% functions; `npm run test:contracts`: 20/20 on 2026-08-28 | Add a stable Solidity coverage threshold when the pinned Foundry runner can produce it consistently; `npm run check` owns repository-wide QA |
| QA-2 | Aggregate build/test/lint/format/package check exists | Pass locally | `npm run check` runs core tests, demo test/lint, Solidity format, shell syntax, and installs the packed SDK in a clean consumer; CI mirrors these surfaces | Keep the clean-checkout CI gate required for every public release |
| QA-3 | Locked JavaScript dependencies have no known npm advisories | Pass locally | `npm audit --audit-level=high` returned `0 vulnerabilities` for both graphs; demo uses stable Vite + React with no vinext/server-component beta runtime | Advisory databases change; retain automated auditing and rerun before release |
| DEMO-1 | Web workbench consumes the shared SDK without decoder drift | Pass locally | `demo` depends on `file:../packages/sdk`; Inspect, registry resolution, and Preflight import SDK APIs; the former copied `demo/lib/attribution.ts` is removed | Keep the demo build after the SDK build in CI |
| DEMO-2 | Inspect defaults to confirmed schema 1 Fuji evidence and preserves provenance | Local pass; production deploy pending | Default transaction `0x2e82…3530` embeds registry `0x9695…4653` and chain `43113`; historical lookup is collapsed and invoked only for schema 0 | Repeat browser acceptance after production deploy |
| DEMO-3 | Preflight demonstrates schema 1 matching return data and baseline-verified fallback | Local pass; production deploy pending | Default compatible and strict samples use the new schema 1 registry and current Fuji contracts | Repeat browser acceptance after production deploy; equal return data remains point-in-time evidence |
| UX-1 | Core states, accessibility, and responsive layout are usable | Local pass; production deploy pending | 12 demo tests cover validation, presentation, type checking, stable static build, default schema 1 evidence alignment, and removal of beta runtime dependencies | Repeat responsive and console QA after deployment; a formal third-party WCAG audit is not claimed |
| PROV-1 | Historical Fuji deployment has reachable, reproducible source | Live/public pass | Commit `0c0665124ed8f1edc5372ed48c77a92a941d08be` predates deployment and is preserved by published annotated tag `fuji-schema0-v0.1.0`; `verify:fuji` verifies the tag target, rebuilds source, and compares bytecode hashes | Retain the public tag and fail future manifests without a deployment-specific durable ref |
| FUJI-1 | Historical contracts, receipts, legacy registry state, schema 0 transaction, and strict negative path are automatically checked | Live pass; repeatable | Manifest records `reverifiedAt: 2026-08-27T21:37:22Z`; `npm run verify:fuji` passed against public Fuji and checks the source tag, chain ID, live bytecode, all receipts, legacy record, attributed tx, original `strictPing(41)` success, and attributed `UnexpectedCalldataLength(65)` revert | Keep the scheduled live verifier enabled to detect later RPC or chain drift |
| FUJI-2 | A pinned-ABI `ICodeRegistry` registry and schema 1 proof exist on Fuji | Live/public pass | Tagged source `fuji-schema1-v0.1.0`, manifest, three runtime hashes, five receipts, registry reads, confirmed tx `0x2e82…3530`, and strict negative path pass `npm run verify:fuji:schema1` | Maintain scheduled verification and avoid implying final-standard or official-registry status |
| TRUST-1 | Public surfaces state attribution is a declaration, not authentication | Pass in docs | README, SDK README, format doc, application, and product docs disclose copyability/spoofing | Keep the warning adjacent to registry, payout, analytics, and reward output |
| RELEASE-1 | SDK artifact is installable by a clean consumer | Pass locally; publication pending | `verify:package` packs and installs the tarball in a temporary consumer, including the isolated legacy subpath; npm auth is not configured on the release machine | Publish the immutable GitHub release now; publish npm only after registry credentials are configured |
| SEC-1 | Contracts/SDK have independent security assurance | Not delivered | Unit/fuzz tests exist, but no external audit is claimed | Targeted independent review; resolve high severity findings before mainnet recommendation |
| VALID-1 | External interviews/adopters/pilots demonstrate demand | No evidence yet | Market-validation document explicitly records zero interviews/adopters | Complete documented discovery and external Fuji pilots; self-generated transactions do not count |

## Developer-release acceptance gate (Milestone 2)

Milestone 2 is complete only when all of the following public evidence exists:

1. The package/release identifies draft commit `457532f5…` and publishes schema 0 and
   schema 1 fixtures used by at least two independent implementations.
2. The Fuji registry is deployed from a reachable immutable tag and all four pinned
   `ICodeRegistry` views pass read-only checks for valid, invalid, registered,
   unregistered, and inactive cases.
3. A confirmed schema 1 Fuji transaction embeds the new registry address and chain ID
   `43113`, preserves the original calldata, and resolves the declared code through the
   pinned ABI.
4. A versioned manifest records compiler settings, source permalink, runtime hashes,
   transactions, blocks, and decoded fields.
5. One automated command rebuilds the deployment source and checks live bytecode,
   receipts, registry behavior, and the schema 1 transaction with nonzero exit on drift.
6. Two independent developers complete the public quickstart. Their evidence remains
   external validation, not another maintainer-run test.

## Non-negotiable limitations

- Codes are public and spoofable; attribution alone cannot authorize or pay anyone.
- The current schema 1 Fuji deployment implements one pinned draft revision; it is not
  an official Avalanche registry or proof of a finalized ERC.
- The SDK is not yet published to npm, the contracts are unaudited, and the repository documents no
  external adopters or interviews as of the assessment date.
