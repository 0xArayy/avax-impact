# Technical implementation assessment

Assessment date: **2026-08-27**
Scope: contracts, SDK, operational scripts, deployment evidence, tests, CI, and public
documentation in the current checkout.

## Executive verdict

AVAX Impact is a working local developer prototype with a materially stronger evidence
path than the historical deployment alone:

- the SDK implements legacy schema 0 and schema 1 pinned to ERC-8021 draft commit
  `457532f5c064a4619868ee5e4950f0cc32a7917e`;
- the current local registry implements the pinned `ICodeRegistry` read ABI and retains
  explicit AVAX Impact lifecycle extensions;
- exact-call preflight, transaction analysis, standard/legacy registry reads, shared
  fixtures, and a complete read-only CLI are tested;
- historical Fuji provenance is restored to reachable commit `0c066512…`, and
  `npm run verify:fuji` rebuilds that source before checking live chain evidence.

The most important boundary is deployment versioning. The existing Fuji registry and
transaction predate the current conformance work. They prove a schema 0 wire-format
prototype with the legacy AVAX Impact registry, not a canonical/interoperable registry
or a schema 1 deployment. A new conformant Fuji registry plus a verified schema 1
transaction remains Milestone 1.

The project also remains pre-adoption and pre-assurance: the package is unpublished,
the contracts are unaudited, and no external interview, adopter, or pilot is documented.

## Pinned draft and supported formats

The implementation identifies the upstream draft by immutable permalink:
[`ERCS/erc-8021.md@457532f5`](https://github.com/ilikesymmetry/ERCs/blob/457532f5c064a4619868ee5e4950f0cc32a7917e/ERCS/erc-8021.md).
ERC-8021 is still a draft.

| Surface | Current behavior | Evidence boundary |
| --- | --- | --- |
| Schema 1 codec | Encodes registry address, minimal big-endian chain ID, codes, schema byte, and marker; decodes nonempty/nonzero variable-length chain IDs | Pinned example and local vectors pass; the draft does not require minimal chain-ID bytes; no conformant Fuji transaction yet |
| Schema 0 codec | Encodes/decodes the earlier code-only suffix | Required for the historical Fuji proof; no embedded registry context |
| Conformance vectors | Exports pinned positive plus legacy/malformed cases | Shared inside the SDK; a second implementation must consume them for cross-implementation evidence |
| Version identifiers | Exports exact pinned and legacy format strings | Prevents silent drift if upstream changes |

## Architecture and trust boundaries

| Layer | Responsibility | Boundary |
| --- | --- | --- |
| `packages/sdk/src/codec.ts` | Schema 0/schema 1 encode, decode, detect, strip | Pure local parsing of untrusted public bytes |
| `packages/sdk/src/dry-run.ts` | Exact attributed `eth_call`; original-calldata fallback | Does not sign/broadcast; state can change after simulation |
| `packages/sdk/src/rpc.ts` | Timeout-aware JSON-RPC envelope/error validation | Trusts the caller-selected endpoint for returned chain data |
| `packages/sdk/src/transaction.ts` | Chain-check and declared/unattributed/malformed classification | Does not fetch receipts and permits pending `blockNumber: null`; decoded data is not confirmation or authentication |
| `packages/sdk/src/registry.ts` | Pinned `ICodeRegistry` reader and separate legacy reader | Registry data is public owner-asserted metadata, not sender authorization |
| `packages/sdk/src/cli.ts` | Encode/decode/decode-tx/resolve/preflight/validate workflows | Read/preflight tool; does not manage keys or submit transactions |
| `contracts/src/BuilderRegistry.sol` | First-come code registration, payout/URI, transfer, deactivation, pinned resolver views | Non-custodial and outside target execution; permits squatting/front-running |
| Demo contracts | Positive and strict trailing-calldata behavior | Fixtures only, not universal compatibility evidence |
| Shell deployment/send scripts | Fuji mutation path with chain guard | Uses an environment private key; operational hardening remains |
| `scripts/verify-fuji.mjs` | Rebuild and read-only live evidence checks | Verifies the historical manifest, not a future conformant deploy |

## Current SDK and contract evidence

Local commands run on 2026-08-27:

| Command | Observed result |
| --- | --- |
| `npm run test:sdk` | PASS: 33 tests, 0 failed/skipped |
| `npm run test:contracts` | PASS: 18 tests, 0 failed/skipped, including 256-run fuzz cases |
| `npm run check` | PASS: core suites, demo build/tests/lint, Solidity format, and shell syntax |
| `npm audit --audit-level=high` (root and `demo`) | PASS: 0 known vulnerabilities in both lock-file graphs |
| restored source lookup | PASS: commit `0c0665124ed8f1edc5372ed48c77a92a941d08be` exists with commit time before deployment |
| `npm run verify:fuji` source phase | PASS: restored commit is available and reproduces recorded runtime bytecode |

The SDK suite covers:

- pinned schema 1 example and legacy schema 0 round trips;
- malformed hex, marker, length, schema, code, and registry context;
- shared conformance vectors;
- exact sender/value dry-run context and fallback paths;
- JSON-RPC HTTP, RPC, malformed, timeout, abort, and transport handling;
- transaction chain checking and declared/unattributed/malformed classification;
- pinned `ICodeRegistry` resolution and legacy Fuji record resolution;
- CLI schema 1 output, full command surface, and partial-context rejection.

`analyzeTransaction` fetches and decodes a transaction but does not establish
confirmation. The public Fuji sample is confirmed separately because `verify:fuji`
checks its successful receipt and recorded block before decoding it.

The contract suite covers the four canonical selectors and views, lifecycle transitions,
authorization, input bounds, permanent deactivation, and fuzzed validity/lifecycle
behavior. These tests support the local implementation claim. They do not upgrade the
historical Fuji bytecode.

## Browser acceptance

The current workbench was also exercised through a real Chromium session against the
local dev server and public Fuji RPC on 2026-08-27. This caught a browser-only unbound
`fetch` failure that Node mocks did not expose; the RPC client now binds the host fetch
implementation and includes a regression test. The complete browser round was then
restarted and passed:

- the recorded Fuji transaction decoded to `avax-impact`, block `57,881,798`, and the
  active legacy owner/payout/metadata record;
- the pinned schema 1 fixture decoded locally and reported registry chain `8453` rather
  than inventing Fuji provenance;
- the compatible Fuji registry call retained attributed calldata;
- the live strict-calldata contract rejected the suffix and the UI selected the
  byte-identical original `strictPing(41)` calldata;
- desktop and 390×844 layouts rendered without horizontal control overflow, and the
  browser console contained no application errors after the fixed rerun.

The demo additionally has 10 passing strict-sample, sample-recovery, validation,
presentation, provenance, fallback, pending-state, SSR, and production-handler tests.
This is strong functional evidence, not a formal WCAG or third-party usability
certification.

## Deployment provenance and automatic verification

`deployments/fuji.json` now records:

- source commit `0c0665124ed8f1edc5372ed48c77a92a941d08be` and immutable URL;
- a source commit timestamp before the deployment timestamp;
- Solidity `0.8.24`, optimizer settings, runs, and Cancun EVM target;
- runtime bytecode sizes and hashes;
- every deployment, registration, and attributed transaction hash/block;
- the legacy builder record and explicit legacy/schema 0 labels;
- `reverifiedAt: 2026-08-27T08:05:43Z`.

`npm run verify:fuji` automates the acceptance path:

1. rebuild the current checkout;
2. confirm and archive the recorded deployment commit;
3. rebuild that exact historical source offline;
4. compare rebuilt bytecode to the manifest and live Fuji bytecode;
5. check Fuji chain ID and all recorded receipt status/block pairs;
6. resolve the builder through the legacy registry;
7. fetch and decode the attributed transaction, target, schema 0 code, and original
   `ping(41)` calldata.

The manifest records a successful networked re-verification on the assessment date. The
same `npm run verify:fuji` command passed against the public Fuji RPC in this assessment:
historical source reproduction, three live bytecode comparisons, five receipts, the
legacy registry record, and the attributed transaction all agreed. Grant submission
should rerun it to detect later RPC availability or chain drift.

## Local conformance versus deployed prototype

| Claim | Honest status |
| --- | --- |
| SDK supports pinned schema 1 | Yes, locally tested |
| SDK preserves legacy schema 0 | Yes, locally tested and used by historical Fuji tx |
| Current local registry implements pinned read ABI | Yes, locally tested |
| Existing Fuji registry implements pinned read ABI | No; it predates the interface and uses AVAX Impact's legacy resolver |
| Existing Fuji tx proves schema 1 registry context | No; it is schema 0 |
| Avalanche selected a canonical registry | No such claim or evidence |
| Project has a new interoperable Fuji registry | Not yet; this is Milestone 1 |

## Security and operational risks

| Severity | Risk | Treatment |
| --- | --- | --- |
| High if monetized | Codes are copyable and declarations are spoofable | Never authorize or automate payouts/rewards/grants from attribution alone; add a separate identity policy if monetization is proposed |
| High if identity-critical | First-come registration permits squatting/front-running | Add claim/dispute or commit-reveal controls before treating records as verified identity |
| Medium | Successful `eth_call` can diverge from later inclusion state | Supply real sender/value, preserve original-calldata fallback, and never promise execution |
| Medium | One-step code ownership transfer | Use two-step propose/accept before production identity use |
| Medium | Metadata URI and payout are owner-asserted | Sanitize fetched content and label fields as unendorsed metadata |
| Medium | Shell mutation path uses an environment private key | Keep Fuji-only low value; prefer keystore/hardware signer for production |
| Medium | No independent security audit | Complete targeted review and remediate high severity findings before mainnet recommendation |

## Product and evidence gaps

- No external design-partner interviews, integrations, recurring users, revenue, or
  independently measured adoption are documented.
- The npm package is not published.
- No new pinned-ABI registry or schema 1 attribution transaction is deployed on Fuji.
- Cross-implementation fixtures currently have only one authoritative SDK consumer.
- There is no proof that downstream analysts will accept a spoofable declaration for
  their reporting job.

These are not hidden release failures. They define the requested grant work and its
falsifiable acceptance gates. See [the acceptance matrix](acceptance-matrix.md) and
[grant application](grant-application.md).

## Grant-ready recommendation

The current repository is credible evidence of implementation ability and careful trust
modeling. It should be presented as an evaluated safety-first Avalanche bundle, never as
the first or only attribution product. Approval should fund the next evidence step:

1. publish the pinned developer release and cross-implementation fixtures;
2. deploy and automatically verify a conformant registry plus schema 1 Fuji transaction;
3. test adoption with independent developers, pilots, and a downstream analyst;
4. obtain targeted security/compatibility review before any mainnet recommendation.
