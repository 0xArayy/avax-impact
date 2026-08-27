# AVAX Impact: market validation

Research snapshot: **2026-08-26**. All web sources below were accessed on that date.

## Decision in one sentence

AVAX Impact should validate one narrow job first: help an Avalanche C-Chain app, wallet,
or transaction-building agent leave a machine-readable declaration that a confirmed
transaction originated through its surface, without deploying a proxy or changing the
target contract ABI.

This is a testable product hypothesis, not an assertion of product-market fit.

## User and pain

### Primary user

The initial user is the engineer or growth lead at an Avalanche C-Chain product that:

- constructs transaction calldata in an app, wallet, bot, or agent;
- sends users directly to third-party contracts, so the destination contract identifies
  the protocol but not the surface that generated the transaction; and
- needs independently reproducible transaction-origin evidence for its own analytics,
  ecosystem reporting, or a builder program.

The initial scope is C-Chain, not every Avalanche L1. The official Avalanche Data API
supports more than 100 mainnet and testnet L1s, which makes an ecosystem-wide indexer a
later expansion rather than a credible mini-grant starting point
([Avalanche Data API](https://build.avax.network/docs/api-reference/data-api)).

### Job to be done

> When a user signs a transaction prepared by my product, let me attach a small public
> declaration of origin and let another party recover it from the confirmed Avalanche
> transaction, without routing execution through my contract.

### Status quo and why it is incomplete

| Current approach | What it establishes | Where it fails for this job |
| --- | --- | --- |
| `from`, `to`, logs, and decoded calls | User address, destination, and contract behavior | The same wallet and protocol can be reached through many apps, wallets, or agents. |
| Product database, UTM, or click analytics | A product observed a session or submitted a transaction | The record is private, can be lost, and is not independently recoverable from the chain. |
| Avalanche Data API / Explorer | Historical transactions, transfers, logs, balances, and decoded onchain activity | The documented data identifies chain activity, not the offchain surface that prepared it. This is an inference from the API's documented feature set, not a claim that no private enrichment exists. |
| Avalanche Metrics API | Chain-level time series such as active addresses | It aggregates network behavior; it does not document app-origin attribution ([getting started](https://build.avax.network/docs/api-reference/metrics-api/getting-started)). |
| Dune Avalanche datasets | Raw and decoded transactions, logs, blocks, and dashboards | Queries can classify contract activity but still need a durable origin signal to distinguish two frontends producing the same call ([Dune Avalanche catalog](https://docs.dune.com/data-catalog/evm/avalanche/overview)). |
| Custom calldata tag | A project-specific origin hint | Every indexer must learn another format; a naive suffix may break targets that validate calldata length or use custom decoding. |

The narrow pain is therefore not “Avalanche lacks analytics.” Avalanche already provides
substantial analytics infrastructure. The pain is the missing input that lets those
systems distinguish the transaction-producing surface from the sender and destination.

## Evidence of demand, with confidence labels

### Strong adjacent evidence

Base has deployed Builder Codes as an ERC-8021-based product with separate integration
guides for apps, wallets, and agents. Its official documentation exposes attribution in a
builder dashboard and connects it to analytics, visibility, and possible rewards
([Base Builder Codes](https://docs.base.org/apps/builder-codes/builder-codes)). This is
evidence that the job exists in an EVM ecosystem. It is **not** evidence that Avalanche
teams will adopt AVAX Impact.

The upstream ERC-8021 proposal describes interoperable attribution for ordinary
transactions and ERC-4337 user operations. It remains a draft, not a finalized ERC.
AVAX Impact's schema 1 implementation is pinned to commit
[`457532f5c064a4619868ee5e4950f0cc32a7917e`](https://github.com/ilikesymmetry/ERCs/blob/457532f5c064a4619868ee5e4950f0cc32a7917e/ERCS/erc-8021.md).
Review discussion also raises the exact risk AVAX Impact tests: appending data can make a
regular transaction fail.

### Avalanche-specific enabling evidence

Avalanche's Data API and Metrics API already provide the data plane on which an
attribution index can be built. The Data API documents real-time and historical EVM
transactions and contract activity, while the Metrics API is unauthenticated for initial
queries and powers network analytics
([Data API](https://build.avax.network/docs/api-reference/data-api),
[Metrics API](https://build.avax.network/docs/api-reference/metrics-api/getting-started)).
This reduces the infrastructure needed to test an Avalanche-native origin signal.

Avalanche also has an active early-stage funding path. The official Team1 page described
Mini Grants as an open application with funding up to $10,000 on the access date
([Team1 Grants](https://www.team1.network/grants)); Builder Hub positions the program as
fast, focused funding for builders creating on Avalanche
([Builder Hub](https://build.avax.network/grants/team1-mini-grants)). This validates the
relevance of grant-reporting workflows, but does not prove that Team1 requires or will
use transaction attribution.

### Evidence already produced by this project

The repository contains a public historical Fuji deployment manifest, a legacy onchain
registry entry, a confirmed schema 0 attributed demo transaction, an RPC decoder, and a
live public inspection/preflight workbench. The source commit `0c066512…` is restored,
preserved by annotated tag `fuji-schema0-v0.1.0`, and
`npm run verify:fuji` rebuilds it before checking live bytecode, receipts, registry state,
and transaction decoding. These prove ability to deliver a prototype path. They do not
prove demand or a conformant schema 1 Fuji deployment:

- public repository: <https://github.com/0xArayy/avax-impact>;
- live Fuji workbench: <https://avax-impact.0xarayy.workers.dev>;
- attributed Fuji transaction:
  <https://testnet.snowtrace.io/tx/0x33c0fb7ee4f48276dd237d67c4f8186b2416d2a033a90068d12efed63c8f0821>;
- reproducible public evidence: [`deployments/fuji.json`](../deployments/fuji.json).

### Evidence not yet available

No external design-partner interview, third-party integration, mainnet attributed
transaction, recurring user, revenue, or independently measured adoption is documented
in this repository as of 2026-08-26. A public grant application must not imply otherwise.

## Competitor and alternative matrix

| Alternative | Avalanche coverage | Durable app / wallet / agent origin | Open interoperable suffix | Compatibility guard before signing | Registry and payout metadata | Main limitation for the target user |
| --- | --- | --- | --- | --- | --- | --- |
| Avalanche Data API, Metrics API, Explorer | Native C-Chain and Avalanche L1 coverage | Not documented | No | Not applicable | No app-origin registry | Excellent chain activity data but no documented origin surface dimension. |
| Dune Avalanche data | C-Chain datasets | Only if inferred or supplied in data | No native origin standard | Not applicable | No | Flexible analysis after the fact; cannot infer which of several frontends prepared an identical call. |
| Base Builder Codes | Base-first product | Yes | ERC-8021 | Base docs state existing contracts work automatically; they do not document an exact-call fallback on the overview page | ERC-721 code plus payout/offchain metadata | Closest validated product, but its registration, dashboard, discovery, and reward surfaces are Base-specific. |
| Custom project suffix or backend analytics | Whatever the project builds | Yes, within that project | No | Project-dependent | Project-dependent | Fragmented decoding and weak independent reproducibility. |
| **AVAX Impact** | **Avalanche C-Chain/Fuji prototype; EVM Avalanche L1-capable SDK** | **Declared attribution** | **Pinned draft schema 1 locally; legacy schema 0 on Fuji** | **Pinned-block original/attributed comparison; baseline-verified fallback** | **Pinned resolver locally; legacy AVAX Impact registry on Fuji** | **Unaudited and unpublished, with no external adopters; no conformant schema 1 Fuji deploy; codes are public and copyable.** |

“Declared attribution” is intentional. The suffix is not signed by the builder and must
not be used as authorization or as an automatic payment oracle.

## Unique wedge

The wedge is not a new general-purpose analytics platform and not a claim to have
invented transaction attribution. It is the evaluated combination of a safety-first
Avalanche bundle:

1. **Avalanche-native evidence path.** Local conformant components, a clearly labeled
   legacy Fuji proof, automated provenance verification, decoder, and planned pilots are
   scoped to Avalanche C-Chain.
2. **Execution compatibility gate.** The SDK pins one block, requires the original call
   to succeed, compares original/attributed return data, returns the tested original only
   for a recognized attributed-only revert by default, and blocks mismatches or
   infrastructure failures.
3. **A negative test is part of the product.** The Fuji deployment includes a strict
   contract that deliberately rejects trailing calldata, making the fallback behavior
   reproducible rather than theoretical.
4. **No routing contract.** Attribution does not introduce custody, a proxy, or an
   execution-path dependency.
5. **Honest trust boundary.** The registry makes metadata ownership auditable, but the
   public code remains copyable; consumers must label it as declared attribution.

This is a differentiation against the evaluated alternatives, not an unverified “first”
or “only” claim.

## Validation plan and falsification criteria

All numbers in this section are future thresholds, not achieved metrics.

| Hypothesis | Test | Pass threshold | Falsified or materially weakened when |
| --- | --- | --- | --- |
| H1: origin attribution is a painful job for Avalanche transaction builders | Interview 10 qualified C-Chain app, wallet, or agent teams; ask about current evidence workflow before showing the product | At least 5 describe the origin gap unprompted or show a manual workaround, and at least 3 agree to a technical pilot | Fewer than 3 rank it among their top three analytics/reporting problems, or no team will test it |
| H2: integration is small enough to adopt | Give the SDK and integration guide to design partners without pairing on the first attempt | Two teams produce a valid attributed Fuji transaction within one engineering day each | Neither of two teams can integrate without modifying a target contract, wallet fork, or routing proxy |
| H3: compatibility evidence is trustworthy | Run a published corpus of representative calls against at least five commonly integrated C-Chain protocols/contracts, including strict calldata and different-return cases | Every test pins a block, proves the original baseline, records matching return data or explicit fallback, and produces zero silent selections | Any broadcast uses attributed calldata after comparison blocks it, or state effects differ despite matching return data |
| H4: the signal is useful downstream | Provide an open index export/API to pilot teams and one independent analyst or program operator | Two pilots can reconcile their own confirmed transactions and one downstream consumer reproduces the counts | Consumers still require private session logs to identify origin, or reject declared attribution as too spoofable for their stated use |
| H5: draft-standard risk is manageable | Track ERC-8021 changes and publish versioned fixtures/migration notes | Current decoder remains pinned to `457532f5…`, passes cross-implementation fixtures, and can migrate without ambiguous decoding | The upstream format changes in a way that requires ambiguous decoding or unsafe payload handling |

### Stop conditions

Do not expand to every Avalanche L1, rewards, or automatic grant allocation unless H1-H4
pass. Pause on mainnet rollout if an external review finds a high-severity registry or
decoder issue. If spoofability blocks the intended reporting use, investigate optional
signatures as a separate version rather than presenting v0 as proof of authorship.

## Sources

- Avalanche Builder Hub, “Data API”: <https://build.avax.network/docs/api-reference/data-api>.
- Avalanche Builder Hub, “Getting Started with the Metrics API”: <https://build.avax.network/docs/api-reference/metrics-api/getting-started>.
- Avalanche Builder Hub, “Team1 Mini Grants”: <https://build.avax.network/grants/team1-mini-grants>.
- Team1, “Builder Grants”: <https://www.team1.network/grants>.
- Base Documentation, “Base Builder Codes”: <https://docs.base.org/apps/builder-codes/builder-codes>.
- ethereum/ERCs, “Add ERC: Transaction Attribution,” PR #1209: <https://github.com/ethereum/ERCs/pull/1209>.
- Dune Documentation, “Avalanche C-Chain Overview”: <https://docs.dune.com/data-catalog/evm/avalanche/overview>.

All sources accessed 2026-08-26. Product-specific claims were checked against the
current repository implementation and deployment manifest on that date.
