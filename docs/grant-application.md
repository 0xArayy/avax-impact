# AVAX Impact: Team1 Mini Grant project narrative

Prepared: **2026-08-28**. External market sources were accessed on 2026-08-26. This is
a public, evidence-backed project narrative.

## Application facts

| Field | Answer |
| --- | --- |
| Project | AVAX Impact |
| Category | Avalanche developer infrastructure / analytics primitive |
| Network scope | Avalanche C-Chain and Fuji only during the grant |
| Stage | Working local schema 0/schema 1 implementation plus a public legacy schema 0 Fuji prototype; no documented external adopters yet |
| Requested amount | **USD 10,000** |
| Delivery period | **10 weeks from grant start** |
| Code | <https://github.com/0xArayy/avax-impact> |
| Live demo | <https://avax-impact.0xarayy.workers.dev> |
| License | MIT |

The official Team1 site lists Mini Grants as an open application for early-stage builders
and community initiatives, with funding up to $10,000 as of 2026-08-26
([Team1 Grants](https://www.team1.network/grants)). The request is capped accordingly.

## One-line pitch

AVAX Impact is a safety-first Avalanche attribution bundle implementing ERC-8021 draft
commit `457532f5…` locally, with typed preflight outcomes and an existing schema 0 Fuji
prototype.

## Short project summary

Avalanche's Data API, Metrics API, explorers, and third-party indexers can explain what a
transaction did, which address sent it, and which contracts it touched. They cannot
generally tell which app, wallet, bot, or agent prepared an otherwise identical call.
AVAX Impact adds that missing origin signal as a compact calldata suffix and can resolve
the builder code through an explicitly selected registry.

The local MVP includes schema 0 and pinned schema 1 codecs, a Solidity registry that
implements the pinned `ICodeRegistry` read ABI, a TypeScript SDK and CLI, exact
same-block original/attributed `eth_call` comparison with explicit baseline-verified
fallback, confirmed-receipt analysis,
automated tests, and a live
public inspection/preflight workbench. The existing Fuji contracts and confirmed
attributed transaction are an earlier schema 0 wire-format prototype with AVAX Impact's
legacy registry, not a canonical or interoperable registry deployment. Grant funding
will first validate demand and secure design-partner commitments. A reproducible release,
pilots, and the smallest required data export follow only if that gate passes.

Attribution is a public declaration, not a signature. AVAX Impact will not use it for
authorization or automatic reward payments.

## Problem and ecosystem fit

An Avalanche product often sends users directly to a third-party protocol. The onchain
transaction records the user's address and target contract, not the offchain surface that
generated the call. Teams therefore rely on private session data, address heuristics, or
custom tags that an independent analyst cannot reproduce consistently.

This is narrower than an “analytics” problem. Avalanche already documents extensive
real-time and historical transaction coverage through its Data API and network metrics
through its Metrics API
([Data API](https://build.avax.network/docs/api-reference/data-api),
[Metrics API](https://build.avax.network/docs/api-reference/metrics-api/getting-started)).
AVAX Impact supplies a standardized origin field that can be decoded from the same public
transaction data and exported into existing Avalanche analytics workflows.

The project remains Avalanche-specific during the grant:

- contracts and pilots on Fuji/C-Chain;
- a C-Chain attribution index/export;
- Avalanche integration and compatibility fixtures;
- no deployments or grant spend on unrelated chains.

## Users

Primary users are engineers and growth leads at Avalanche C-Chain apps, wallets, bots,
and agents that build transactions to third-party contracts. Secondary users are
analysts, indexers, and ecosystem program operators who need reproducible evidence of
declared origin.

The grant does not assume that Team1 or Avalanche Foundation will consume the data. One
milestone is to test that downstream interest explicitly.

## Existing alternatives and differentiation

Base Builder Codes is the closest validated product. Its official documentation uses
ERC-8021 attribution for apps, wallets, and agents and connects it to analytics,
discovery, and possible rewards
([Base Builder Codes](https://docs.base.org/apps/builder-codes/builder-codes)). Its
registry and product surfaces are Base-specific.

Dune and Avalanche's own APIs already provide strong Avalanche transaction analytics,
but their documented raw and decoded data does not itself identify the offchain surface
that prepared a call
([Dune Avalanche data](https://docs.dune.com/data-catalog/evm/avalanche/overview)).
Custom backend analytics is not independently recoverable from the confirmed transaction.

AVAX Impact's evaluated, safety-first Avalanche bundle is:

- locally conformant schema 1 codec and `ICodeRegistry` resolver work, with an explicit
  grant milestone for a new conformant Fuji proof;
- a historical schema 0 Fuji deployment with restored, automatically verifiable
  provenance;
- a pinned-block comparison that requires the original call to succeed and original and
  attributed return data to match before attributed handoff;
- deterministic fallback to the already-tested original calldata on a recognized
  attributed-only execution revert, while mismatch and infrastructure failures block;
- a deliberately strict Fuji contract that proves the negative path;
- no proxy, custody, or target-contract upgrade;
- explicit “declared attribution” language that does not overstate identity or reward
  entitlement.

The upstream ERC-8021 proposal remains an open draft. The current implementation pins
commit
[`457532f5c064a4619868ee5e4950f0cc32a7917e`](https://github.com/ilikesymmetry/ERCs/blob/457532f5c064a4619868ee5e4950f0cc32a7917e/ERCS/erc-8021.md)
and exports that revision in its fixtures. AVAX Impact will publish migration notes
rather than claim final-standard compliance.

## Proof of ability to deliver

Public work completed before grant approval:

- local schema 0 and pinned schema 1 codecs plus a local `ICodeRegistry`-conformant
  registry candidate;
- legacy Fuji `BuilderRegistry`, `AttributionDemo`, and `StrictCalldataDemo` deployments;
- registered `avax-impact` builder code in that legacy registry;
- confirmed schema 0 attributed Fuji transaction
  [`0x33c0…0821`](https://testnet.snowtrace.io/tx/0x33c0fb7ee4f48276dd237d67c4f8186b2416d2a033a90068d12efed63c8f0821);
- TypeScript encoder, decoder, validator, CLI, RPC decoder, transaction analyzer, and
  canonical/legacy registry readers;
- same-block dual-call comparison with typed attributed/fallback/blocked outcomes;
- successful-receipt transaction analysis and ERC-5792 `dataSuffix` wallet handoff;
- two-step registry ownership transfer and public security/governance/release processes;
- automated Solidity and TypeScript tests;
- restored deployment source commit `0c066512…`, annotated tag
  `fuji-schema0-v0.1.0`, public
  [Fuji manifest](../deployments/fuji.json), and `npm run verify:fuji`, which rebuilds
  that source and checks live bytecode, receipts, legacy registry state, and the demo
  transaction;
- live public inspection/preflight workbench.

The contracts have not received an external security audit. The package has not been
published to npm. No third-party integration, mainnet transaction, active user count, or
revenue is claimed.

## Milestones and acceptance criteria

All adoption numbers below are targets, not current traction.

| Milestone | Due | Public acceptance criteria | Budget |
| --- | --- | --- | ---: |
| 1. Demand validation and commitments | End of week 2 | 10 qualified problem interviews completed before a product demo; current workarounds and downstream consumer documented; at least 3 written pilot commitments with named integration owners; anonymized positive and negative findings; explicit go/narrow/stop decision | $1,000 |
| 2. Conformant Fuji developer release | End of week 5, only if Milestone 1 passes | Published package and immutable release; pinned fixtures; newly deployed and read-only-verified `ICodeRegistry`-conformant Fuji registry; confirmed schema 1 transaction; Viem/Wagmi, backend, and ERC-5792 recipes; two independent developers complete the quickstart; accepted and strict-rejection compatibility cases | $3,000 |
| 3. External pilots and minimal evidence export | End of week 8 | Two external Fuji integrations; at least 50 confirmed attributed pilot transactions total; published integration time, blocked/fallback cases, and consented hashes; smallest reproducible JSON/CSV/API surface required by pilots; one independent downstream user reproduces a published count | $3,500 |
| 4. Review, remediation, and public report | End of week 10 | Targeted independent review of registry/decoder/fallback boundaries; high-severity findings resolved before mainnet recommendation; final report publishes achieved and missed targets, spend, unresolved risks, maintenance owner, and next-chain decision | $2,500 |
| **Total** |  |  | **$10,000** |

Milestones are proposed as conditional tranches. If Milestone 1 fails, hosted index/API
work stops and later engineering funds should remain undistributed or be returned under
Team1 terms. Payment or completion cannot be justified with self-generated transaction
volume alone.

## Budget rationale

| Use | Amount | Rationale and evidence |
| --- | ---: | --- |
| Engineering: package, fixtures, registry release, pilot export/API | $4,000 | Demand-gated open-source deliverables in milestones 2-3 |
| Targeted independent security/compatibility review | $2,000 | Review registry lifecycle, parsing boundaries, simulation/fallback assumptions; explicitly not marketed as a full audit |
| Discovery interviews and evidence synthesis | $1,000 | Establish demand before data-product investment and publish negative evidence |
| Pilot integration support and small builder bounties | $1,500 | Reduce uncompensated work for two external Avalanche design partners; recipients and amounts reported publicly |
| RPC, hosting, monitoring, and backfill | $800 | Operate only the Fuji/C-Chain surface justified by pilots and preserve reproducible evidence |
| Documentation, demo, release, and final public report | $700 | Integration recipes, compatibility results, immutable artifacts, milestone evidence, and spend report |
| **Total** | **$10,000** | No token purchase, trading, non-Avalanche deployment, or founder travel budget |

Material reallocation above 20% between categories will be disclosed in the public final
report. Any unused funds will be handled according to Team1 terms rather than silently
reclassified.

## Team, governance, and sustainability

The repository currently has one public maintainer, GitHub user `@0xArayy`; no larger
team, prior institutional adoption, or audit history is claimed. This is a bus-factor
risk, so public APIs and deployments require reviewable pull requests, CI, changelogged
releases, immutable tags, and reproducible verifier evidence. The complete policy is in
[`governance.md`](governance.md).

The MIT-licensed SDK, fixtures, and verifier do not depend on permanent hosted services.
After the grant, the maintainer commits to security fixes and evidence-backed draft
migrations. A hosted index/API continues only if pilots identify both a downstream user
and an operating sponsor; otherwise the supported output is a reproducible local export.

## Community traction plan

The current gap is external validation. The project will recruit qualified participants
from Avalanche developer channels and direct outreach, using consistent screening:

- team actively builds C-Chain transactions to third-party contracts;
- interviewee owns the integration or analytics workflow;
- discovery questions come before the product demonstration;
- a positive interview is not counted as an integration;
- only confirmed public Fuji transaction hashes count as pilot output;
- partner names are published only with consent.

The public findings will include negative interviews and abandoned integrations. Detailed
falsification thresholds are in
[`docs/market-validation.md`](market-validation.md).
Public aggregate progress starts at zero in the
[`discovery tracker`](discovery-tracker.md); compatibility claims are bounded by the
[`compatibility corpus`](compatibility-corpus.md).

## Long-term Avalanche impact

If validation passes, Avalanche teams gain a shared origin primitive that existing
indexers and program operators can reproduce from public transaction data. This can make
app/wallet/agent contribution visible even when several surfaces call the same protocol.
The infrastructure is MIT-licensed, has no custody, and does not require protocol
contracts to integrate AVAX Impact.

The mini-grant will not claim ecosystem-wide transaction growth. Its measurable outcome
is smaller: determine whether at least two external Avalanche builders will integrate the
signal and whether one independent downstream user can reproduce it.

Expansion to an Avalanche L1 requires a named design partner and successful C-Chain
pilots. Automatic rewards or grant allocation remain out of scope because v0 codes are
copyable declarations.

## Risks and contingency

| Risk | Response |
| --- | --- |
| No external teams rank the problem highly | Stop L1 expansion; publish interviews and narrow to the safety/decoder tooling or stop the product |
| Strict calldata or custom routers reject suffixes | Require a successful original baseline; use recognized attributed-only revert fallback; block on mismatched return data or inconclusive infrastructure; publish incompatibilities |
| Public builder code is spoofed | Label records as declared attribution; never treat the registry as transaction authorization or automate payouts |
| ERC-8021 draft changes | Keep the exact `457532f5…` pin in artifacts and fixtures; follow the [upstream risk policy](upstream-risk.md) and publish a migration decision before supporting another revision or schema |
| Indexer duplicates existing Avalanche infrastructure | Do not build it before the demand gate; afterward use Builder Hub/Data API-compatible exports and keep the origin decoder thin |
| Security review finds a high-severity issue | Pause mainnet recommendation, remediate, and publish the finding and fix |
| Grant is not awarded | Continue maintaining the existing Fuji MVP; reduce scope to interviews and developer release; do not block already-public work on funding |

## Alignment with published Avalanche review guidance

Avalanche Academy says reviewers evaluate problem/ecosystem fit, proof of delivery,
community traction, and long-term ecosystem impact
([success criteria](https://build.avax.network/academy/entrepreneur/fundraising-finance/10-grants/02-success-criteria)).
It also lists non-Avalanche reasoning, unclear grant usage, missing competitor analysis,
and waiting for approval before building among common mistakes
([common mistakes](https://build.avax.network/academy/entrepreneur/fundraising-finance/10-grants/03-common-mistakes)).

This application addresses those criteria with:

- a C-Chain-only initial user and problem;
- a working Fuji prototype delivered before the application;
- an explicit competitor matrix and draft-standard risk;
- milestones that convert the current traction gap into falsifiable pilots;
- a line-item budget and rejection contingency;
- public evidence for both achieved and missed results.

## Unsupported claims

- “AVAX Impact has users,” “partners,” or “traction.”
- “Avalanche Foundation, Ava Labs, or Team1 will use the data.”
- “ERC-8021 is finalized.”
- “All EVM contracts safely accept trailing calldata.”
- “Attribution proves who created or authorized a transaction.”
- “The contracts are audited.”
- “The SDK is published on npm.”
- “AVAX Impact is the first or only Avalanche attribution solution.”
- “The project will increase transactions, TVL, revenue, or users by a forecast number.”

Replace a statement only after linking public evidence.

## Sources

- Team1, “Builder Grants”: <https://www.team1.network/grants>.
- Avalanche Builder Hub, “Team1 Mini Grants”: <https://build.avax.network/grants/team1-mini-grants>.
- Avalanche Builder Hub, “Data API”: <https://build.avax.network/docs/api-reference/data-api>.
- Avalanche Builder Hub, “Getting Started with the Metrics API”: <https://build.avax.network/docs/api-reference/metrics-api/getting-started>.
- Avalanche Academy, “Successful Grant Applications”: <https://build.avax.network/academy/entrepreneur/fundraising-finance/10-grants/02-success-criteria>.
- Avalanche Academy, “Common Application Mistakes to Avoid”: <https://build.avax.network/academy/entrepreneur/fundraising-finance/10-grants/03-common-mistakes>.
- Base Documentation, “Base Builder Codes”: <https://docs.base.org/apps/builder-codes/builder-codes>.
- ethereum/ERCs, PR #1209: <https://github.com/ethereum/ERCs/pull/1209>.
- Dune Documentation, “Avalanche C-Chain Overview”: <https://docs.dune.com/data-catalog/evm/avalanche/overview>.

All web sources accessed 2026-08-26.
