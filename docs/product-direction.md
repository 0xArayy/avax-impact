# AVAX Impact: product direction

Decision date: **2026-08-26**.

## Product thesis

AVAX Impact is the open attribution layer between an Avalanche transaction-building
surface and Avalanche's existing data systems. An app, wallet, bot, or agent appends a
builder declaration using an explicitly pinned format; the SDK checks the exact call
before signing; an indexer or analyst recovers declared origin from the confirmed
transaction.

The first product is an Avalanche C-Chain developer tool, not a cross-chain attribution
company and not a rewards protocol.

## Why Avalanche

Avalanche already exposes real-time and historical EVM transactions across C-Chain and
many Avalanche L1s through its Data API, and exposes network time-series through its
Metrics API
([Data API](https://build.avax.network/docs/api-reference/data-api),
[Metrics API](https://build.avax.network/docs/api-reference/metrics-api/getting-started)).
AVAX Impact contributes a missing origin dimension that can be decoded from the same
transaction data. It should complement, not duplicate, Builder Hub, Explorer, Dune, or
other indexers.

The official Avalanche grant curriculum evaluates ecosystem fit,
ability to deliver, community traction, and long-term impact
([Successful Grant Applications](https://build.avax.network/academy/entrepreneur/fundraising-finance/10-grants/02-success-criteria)).
The current Fuji proof satisfies only part of “ability to deliver.” The next product
phase is designed to generate the missing community and use evidence.

## Product principles

1. **Avalanche first.** Ship and validate on C-Chain before adding an Avalanche L1. Do
   not spend grant funds on unrelated chains.
2. **Never trade execution safety for attribution.** If the exact attributed call cannot
   be simulated successfully, select the original calldata.
3. **Declared means declared.** A decoded public code is not builder authorization,
   identity proof, or entitlement to payment.
4. **Open evidence.** Fixtures, deployments, compatibility results, and milestone reports
   must be reproducible without private infrastructure.
5. **Integrate into existing data workflows.** Export simple JSON/CSV and documented APIs;
   do not require analysts to adopt a proprietary dashboard.
6. **Version the draft.** ERC-8021 is still an open draft. Schema 1 is pinned to commit
   [`457532f5c064a4619868ee5e4950f0cc32a7917e`](https://github.com/ilikesymmetry/ERCs/blob/457532f5c064a4619868ee5e4950f0cc32a7917e/ERCS/erc-8021.md);
   fixtures and schema support must retain that exact identity.

## Primary workflow

1. A builder registers an Avalanche builder code and public metadata in an explicitly
   selected registry.
2. Its app, wallet, backend, or agent prepares the original target call.
3. The SDK appends the attribution suffix.
4. The SDK performs `eth_call` with the same `from`, `to`, value, and attributed data.
5. On success, the wallet signs attributed calldata; on failure, it signs the original.
6. After confirmation, the decoder or indexer extracts the declared code and resolves its
   registry metadata.
7. Analysts reconcile attributed transactions against public hashes and raw calldata.

## Initial product surfaces

| Surface | User | Required outcome |
| --- | --- | --- |
| TypeScript SDK and CLI | App, wallet, bot, and agent engineers | Encode, decode, validate, resolve, simulate exact calls, and fall back deterministically |
| Avalanche registry | Builders and indexers | Auditable code owner, payout address, metadata URI, status, and lifecycle events |
| Public decoder | Reviewers, analysts, and integrators | Decode calldata or a Fuji/C-Chain transaction without installing the SDK |
| Compatibility corpus | Integrators and security reviewers | Reproduce accepted and rejected trailing-calldata behavior, including strict targets |
| C-Chain attribution export/API | Analysts and pilot teams | Query confirmed declared attribution with transaction hash, block, code, and registry resolution |
| Integration recipes | Wagmi/Viem and backend users | Add attribution without contract redeployment or a routing proxy |

## What v0 will not do

- distribute grants, rebates, fees, or other rewards;
- assert that the registered builder signed or authorized a transaction;
- replace product analytics, sybil analysis, or causal measurement;
- hide attribution or user activity;
- require protocols to modify contracts;
- promise universal compatibility with arbitrary calldata parsers;
- index every Avalanche L1 during the mini-grant;
- add non-Avalanche deployments merely to appear multichain.

## Roadmap with decision gates

### Phase 0: delivered technical proof

Evidence already in the repository:

- builder registry and compatible/strict demo contracts;
- TypeScript encoder, decoder, validator, CLI, and RPC transaction decoder;
- exact-call simulation with original-calldata fallback;
- public legacy schema 0 Fuji contracts, AVAX Impact registry entry, and confirmed
  attributed transaction;
- restored deployment source provenance plus automated rebuild/live verification;
- live public inspection/preflight workbench and automated Solidity/TypeScript tests.

The local schema 1 codec and registry candidate conform to the pinned draft surfaces.
The existing Fuji deployment does not: it remains schema 0 plus the legacy AVAX Impact
registry. This is prototype evidence, not traction.

### Phase 1: reproducible developer release

Target window: weeks 1-3 after grant start.

- publish a versioned package and immutable release artifacts;
- preserve the exact `457532f5…` draft pin and publish schema 0/schema 1
  cross-implementation fixtures;
- deploy a new `ICodeRegistry`-conformant registry on Fuji and publish a confirmed
  schema 1 transaction embedding its address and chain ID;
- extend the read-only verification pattern to the new deployment so it rebuilds source
  and checks live bytecode, receipts, all registry views, registry resolution, and
  schema 1 transaction fields;
- add integration recipes for direct Viem/Wagmi calls and backend signers;
- publish a compatibility corpus with positive and strict-calldata negative cases;
- document error taxonomy, fallback telemetry, and privacy/trust language.

Gate: two independent developers must complete the Fuji recipe from public docs. If they
cannot, fix the integration surface before building a production indexer.

### Phase 2: C-Chain attribution data product

Target window: weeks 3-6.

- build a minimal confirmed-transaction indexer/export for C-Chain and Fuji;
- resolve registry metadata at a documented block/time;
- expose JSON/CSV plus a small read API, with replay/backfill instructions;
- label malformed, inactive, unregistered, and unresolved codes explicitly;
- keep raw transaction hash and suffix bytes in every record for auditability.

Gate: one independent analyst must reproduce a pilot count from public chain data. If
the count depends on private logs, the product has not satisfied the job.

### Phase 3: design-partner pilots

Target window: weeks 5-9.

- interview 10 qualified Avalanche C-Chain teams before presenting the solution;
- integrate two willing apps, wallets, or agents on Fuji;
- record integration time, fallback cases, abandoned attempts, and confirmed hashes;
- publish anonymized interview findings unless a participant consents to attribution;
- request one downstream evaluation from an analyst, ecosystem operator, or grant
  reviewer without implying Foundation endorsement.

Gate: the thresholds in [`market-validation.md`](market-validation.md) determine whether
to continue, narrow, or stop.

### Phase 4: release and next-chain decision

Target window: weeks 9-10.

- obtain a targeted independent review of registry, decoder boundaries, and fallback
  behavior; this is not represented as a full audit;
- remediate findings and publish the review scope and unresolved risks;
- produce a public milestone report with spend and achieved/failed targets;
- decide whether evidence supports C-Chain mainnet use and one named Avalanche L1 pilot.

No Avalanche L1 expansion is approved by this roadmap without two C-Chain pilots and a
specific L1 design partner.

## Success measures

These are proposed targets, not current results:

- 10 qualified discovery interviews with full notes and selection criteria;
- at least 3 teams agreeing to a technical pilot;
- at least 2 independent Fuji integrations completed in no more than one engineering day
  each;
- at least 50 confirmed attributed Fuji transactions across the two pilots;
- a public compatibility corpus covering at least five commonly integrated C-Chain
  contracts/protocols plus strict negative cases;
- zero cases where the SDK selects attributed calldata after the exact simulation rejects
  it;
- one independent reproduction of pilot attribution counts from public data;
- all known high-severity review findings resolved before recommending mainnet use.

Targets that are missed remain in the report. They must not be rewritten as achieved
outcomes.

## Product risks and mitigations

| Risk | Consequence | Mitigation / decision |
| --- | --- | --- |
| Public codes can be copied | False declarations and inflated counts | Label as declared attribution; expose sender and raw evidence; never automate payouts in v0 |
| Target rejects trailing data | Revert or changed routing | Exact-call simulation and deterministic fallback; publish compatibility corpus |
| Simulation differs from inclusion state | A later broadcast can still fail for ordinary state reasons | Do not promise execution; preserve wallet gas/state handling and record selected calldata |
| ERC-8021 changes before finalization | Fixture or decoder drift | Keep `457532f5…` immutable in current artifacts; version any migration and avoid “final standard” language |
| Wallets hide/transform calldata | Integration failure | Test direct EOA, ERC-5792 capability, and backend paths separately; do not claim universal wallet support |
| No Avalanche team values the signal | Technically sound but unused product | Run interviews and pilots before L1 expansion; apply stop conditions |
| Grant reviewer interprets payout metadata as entitlement | Governance and fraud risk | State that payout address is metadata only and requires independent program rules/verification |
| Scope expands into analytics platform | Delayed adoption and duplicated infrastructure | Export to Builder Hub/Data API/Dune-compatible workflows; keep dashboard optional |

## Decision after the mini-grant

Proceed to a C-Chain mainnet beta only if two external pilots and one independent data
consumer pass the validation gates. Otherwise publish the findings and choose one of:

- simplify to a compatibility-safe ERC-8021 SDK if origin demand exists but registry or
  indexing does not;
- add optional builder signatures in a new schema if spoofability is the blocking issue;
- stop the product if teams do not value durable transaction origin.

The grant buys a public answer to the adoption question, not a predetermined claim that
AVAX Impact must scale.
