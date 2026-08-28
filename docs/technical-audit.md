# Technical implementation assessment

Assessment date: **2026-08-28**
Scope: contracts, SDK, operational scripts, deployment evidence, tests, CI, and public
documentation in the current checkout.

## Executive verdict

Builder Attribution SDK is a reproducible Fuji prototype with a schema 1 default path,
an immutable deployment source, live compatibility evidence, and an explicit safety
boundary:

- the default SDK and CLI encode schema 1 pinned to ERC-8021 draft commit
  `457532f5c064a4619868ee5e4950f0cc32a7917e`;
- registry address and chain ID are required instead of inferred;
- registry `0x96951d7e43812474Bb4AF211dcCAd13080D44653`, positive and strict demo
  targets, registration, and a confirmed attributed transaction are live on Fuji;
- `fuji-schema1-v0.1.0` preserves the exact deployment source and the verifier rebuilds
  that source before comparing live bytecode, receipts, registry reads, transaction
  fields, and the strict negative path;
- schema 0 reproduction is isolated under `@avax-impact/sdk/legacy`, explicit CLI
  commands, its own manifest, and its own verifier;
- five external contract read calls are exercised in the live compatibility corpus.

The remaining limits are product and assurance limits: ERC-8021 is still a draft, the
contracts are unaudited, npm publication credentials are not configured, and no
external adopter or independent pilot is documented.

## Supported formats and trust boundary

| Surface | Current behavior | Evidence boundary |
| --- | --- | --- |
| Schema 1 codec | Default encode/preflight path; embeds registry, chain ID, codes, schema byte, and marker | Local vectors plus confirmed Fuji transaction; pinned draft, not a finalized ERC |
| Schema 0 codec | Explicit legacy import and CLI commands only | Historical reproduction; never selected implicitly |
| Registry | Standard pinned read ABI plus lifecycle extensions | Owner-asserted public metadata; not sender authentication or Avalanche endorsement |
| Attribution | Public, copyable declaration | Must not authorize access, identity, grants, rewards, or payouts |
| Preflight | Same-block original/attributed `eth_call`, baseline requirement, return-data comparison | Does not prove equal storage, logs, gas, later state, or eventual inclusion |

## Architecture

| Layer | Responsibility | Boundary |
| --- | --- | --- |
| `packages/sdk/src/codec.ts` | Schema 1 encode, decode, detection, and stripping | Pure parsing of untrusted public bytes |
| `packages/sdk/src/legacy.ts` | Historical schema 0 codec and registry reader | Separate package export; no implicit downgrade |
| `packages/sdk/src/dry-run.ts` | Pinned-block comparison and typed attributed/fallback/blocked result | Infrastructure errors and mismatches block handoff |
| `packages/sdk/src/rpc.ts` | Timeout-aware JSON-RPC validation | Trusts the caller-selected endpoint for chain data |
| `packages/sdk/src/transaction.ts` | Chain check, classification, and optional successful-receipt confirmation | Pending inspection is distinguished from confirmed evidence |
| `packages/sdk/src/registry.ts` | Standard `ICodeRegistry` reader | Record fields remain unendorsed owner assertions |
| `packages/sdk/src/cli.ts` | Encode, decode, decode-tx, resolve, preflight, validate, and explicit legacy commands | Does not manage keys or submit transactions |
| `contracts/src/BuilderRegistry.sol` | Registration, payout/URI, two-step transfer, deactivation, standard views | First-come codes can still be squatted or front-run |
| `scripts/verify-fuji-schema1.mjs` | Rebuild and read-only live evidence checks | Verifies recorded deployment, not universal compatibility |
| `scripts/verify-compatibility.mjs` | Live first-party and external contract probes | Read-only sample corpus, not protocol endorsement or exhaustive coverage |

## Verified evidence

The repository gate on 2026-08-28 reports:

| Command | Result |
| --- | --- |
| `npm run test:sdk` | PASS: 48 tests with enforced 85/70/95 line/branch/function floors |
| `npm run test:contracts` | PASS: 20 tests, including fuzz cases |
| `npm run check` | PASS: SDK/contracts, demo build/tests/lint, formatting, shell syntax, and clean package consumer |
| `npm run verify:fuji:schema1` | PASS: immutable source, three bytecodes, receipts, registry reads, confirmed transaction, strict negative path |
| `npm run verify:compatibility` | PASS: three first-party cases, five attributed external reads, and one honest baseline failure |
| root and demo `npm audit --audit-level=high` | PASS at assessment time; advisory databases can change |

The current deployment is recorded in
[`deployments/fuji-schema1.json`](../deployments/fuji-schema1.json):

| Item | Address or transaction |
| --- | --- |
| Builder registry | `0x96951d7e43812474Bb4AF211dcCAd13080D44653` |
| Compatible demo | `0xbDe66e5Ae9651C24173CC3DEFc5a4d5D7a186639` |
| Strict demo | `0x752495F1423edE0606329fCC7bFC0B18FE3DD005` |
| Registration transaction | `0x48c371d24618ba97f16ccfc49d7d6c46894e2e99e49a2900c86bdf36c8e38915` |
| Schema 1 transaction | `0x2e826a5bf4ff5c4058618d4a432ed925c86b79055cd03a0f4b7309f2faf03530` |

The schema 1 transaction decodes to registry chain `43113`, code `avax-impact`, and
original `ping(41)` calldata. Runtime hashes are checked against a rebuild of immutable
tag `fuji-schema1-v0.1.0`. The older schema 0 proof remains reproducible but is not used
as current evidence.

## Compatibility evidence

The corpus covers the current registry and demo contracts plus live read calls against
Aave V3, LFJ, Circle USDC, BENQI sAVAX, and Chainlink AVAX/USD. A separate Aave borrow
case fails at the original baseline and is labeled `original-call`, not trailing-byte
incompatibility. These probes show that the selected calls behaved as recorded at their
pinned blocks; they do not certify whole protocols or future behavior.

## Security and operational risks

| Severity | Risk | Treatment |
| --- | --- | --- |
| High if monetized | Codes and declarations are copyable | Never automate identity, authorization, grants, rewards, or payouts from attribution alone |
| High if identity-critical | First-come registration permits squatting/front-running | Add a separate identity, claim, or dispute policy before verified-identity use |
| Medium | Simulation can diverge from later inclusion | Use real sender/value, block infrastructure failures and mismatches, and never promise execution |
| Medium | Metadata URI and payout are owner-asserted | Label as unendorsed and sanitize any fetched content |
| Medium | Deployment script accepts an environment private key | Keep testnet accounts low-value; use a hardware or managed signer for material environments |
| Medium | No independent security audit | Obtain targeted contract and SDK review before a mainnet recommendation |

## Remaining grant-relevant gaps

- No external design-partner interview, independent integration, recurring user,
  revenue, or measured adoption is documented.
- The npm package is not published because the release environment has no npm auth.
- The pinned draft can change; upstream drift must trigger an explicit compatibility
  release rather than silent reinterpretation.
- Cross-implementation fixtures still have one authoritative SDK consumer.
- Mainnet use and canonical Avalanche registry status are not claimed.

The technical milestone is now substantially stronger than a local prototype. The next
grant decision should be gated on external problem evidence and independent integration,
not another first-party deployment.
