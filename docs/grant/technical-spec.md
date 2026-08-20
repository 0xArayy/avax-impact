# AVAX Impact Technical Specification

## 1. Objective

AVAX Impact provides application-level transaction attribution across Avalanche C-Chain and Avalanche L1s.

The MVP must let an application:

1. register a builder code;
2. append that code to a compatible EVM transaction;
3. submit the transaction through its existing wallet stack;
4. have an independent indexer detect and validate the attribution;
5. expose the attributed activity through a public API and dashboard.

Attribution is metadata. It must not authorize transactions, custody assets, alter contract state, or become a dependency for application execution.

## 2. Non-goals

The MVP will not:

- launch a token;
- create a new Avalanche L1;
- distribute financial rewards;
- claim support for every EVM contract;
- provide Sybil-proof identity;
- replace chain explorers or protocol analytics;
- calculate an official Avalanche Foundation GCP or GCI figure;
- use attribution as a security or permission check.

## 3. Architecture

```text
App / wallet / bot
       |
       | 1. encode normal call + attribution suffix
       v
Avalanche C-Chain or EVM L1
       |
       | 2. confirmed transaction
       v
Chain ingestion worker
       |
       | 3. detect marker, decode code, validate registry
       v
PostgreSQL attribution store
       |
       +-------------------+
       |                   |
       v                   v
Public REST API       Next.js dashboard
```

## 4. Attribution format

### 4.1 Compatibility goal

The first implementation should remain compatible with ERC-8021 where practical. Compatibility allows existing EVM wallets and libraries that support `dataSuffix` to integrate with minimal Avalanche-specific code.

The decoder parses from the end of transaction calldata:

```text
<normal ABI calldata><schema data><schema id><fixed marker>
```

Schema 0 contains one to four distinct human-readable builder codes joined by commas. Each code is 3–32 bytes and contains lowercase ASCII letters, digits, and single internal hyphens. Codes cannot start or end with a hyphen, and the complete comma-joined payload cannot exceed 255 bytes. The payload is followed by its one-byte length, the one-byte schema ID `0x00`, and the fixed 16-byte ERC-8021 marker `0x80218021802180218021802180218021`.

### 4.2 Compatibility limitation

Extra calldata is ignored by many ABI-decoded Solidity calls, but this behavior is not universal. Contracts may inspect `msg.data.length`, use custom assembly decoders, validate raw calldata, or implement fallback behavior that rejects the suffix.

Therefore:

- integration is opt-in;
- the SDK never appends attribution globally without application consent;
- the test suite maintains known-compatible and known-incompatible calls;
- documentation must state that attribution is not universally safe;
- failed compatibility checks fall back to the original unattributed transaction.

## 5. Builder registry

### 5.1 Required interface

The registry maps a normalized builder code to:

- owner address;
- payout address;
- metadata URI;
- registration timestamp;
- active or revoked state.

Expected operations:

```solidity
register(string code, address payoutAddress, string metadataURI)
updatePayoutAddress(string code, address payoutAddress)
updateMetadataURI(string code, string metadataURI)
transferCode(string code, address newOwner)
deactivateCode(string code)
isRegistered(string code) view returns (bool)
resolve(string code) view returns (BuilderRecord)
```

The implementation must define:

- allowed character set;
- minimum and maximum code length;
- case normalization;
- duplicate prevention;
- zero-address handling;
- ownership transfer behavior;
- metadata-size bounds;
- event schema.

### 5.2 Deployment model

MVP deployments:

- Avalanche Fuji;
- Avalanche C-Chain mainnet;
- optionally one pilot L1 if a canonical registry deployment is useful there.

The indexer can use the C-Chain registry as the initial identity source for all supported EVM L1s. ICM-based registry synchronization is deferred until the core model is validated.

## 6. SDK

### 6.1 Packages

Proposed packages:

```text
@avax-impact/core       Encoder, decoder, validators, shared types
@avax-impact/viem       Viem helpers and wallet_sendCalls support
@avax-impact/wagmi      React hooks and Wagmi configuration
@avax-impact/ethers     ethers.js transaction helpers
```

The repository may begin as a single package and split after the public API stabilizes.

### 6.2 Required functions

```ts
encodeAttribution(codes: string[]): Hex
appendAttribution(calldata: Hex, codes: string[]): Hex
detectAttribution(calldata: Hex): boolean
decodeAttribution(calldata: Hex): AttributionResult
stripAttribution(calldata: Hex): Hex
validateBuilderCode(code: string): ValidationResult
```

### 6.3 Integration behavior

- Preserve original calldata byte-for-byte before the suffix.
- Reject malformed or oversized codes before wallet submission.
- Support multiple codes only if the attribution standard defines ordering and maximum count.
- Treat the first release as opt-in and explicit.
- Provide a dry-run helper using `eth_call` before submission.
- Preserve the original transaction if the dry run fails.

## 7. Indexer

### 7.1 Inputs

- C-Chain RPC or Avalanche Data API;
- one selected Avalanche L1 RPC;
- registry events and state;
- chain metadata and native-token price source;
- allowlisted ERC-20 transfer events for asset-flow calculations.

### 7.2 Pipeline

1. Fetch finalized blocks.
2. Read transaction calldata and receipts.
3. Check for the fixed attribution marker.
4. Decode schema and builder codes.
5. Validate each code against the registry snapshot for that block.
6. Store raw attribution facts.
7. Derive aggregates in separate jobs.

Raw chain facts must remain separate from derived metrics so calculations can be changed without rewriting ingestion history.

### 7.3 Reorg and finality handling

Avalanche normally finalizes quickly, but the indexer must still be restart-safe and idempotent.

- Primary key: `(chain_id, transaction_hash, builder_code)`.
- Store block height and block hash.
- Use upserts for repeated ingestion.
- Track a per-chain cursor.
- Revalidate a bounded recent block window on restart.
- Never double-count a transaction after worker retries.

## 8. Data model

Minimum tables:

```text
chains
builders
builder_metadata_versions
blocks
transactions
transaction_attributions
token_transfers
daily_builder_metrics
indexer_cursors
```

Minimum transaction attribution fields:

- chain ID;
- transaction hash;
- block number and timestamp;
- sender;
- destination;
- builder code;
- schema ID;
- registry validation state;
- gas used;
- effective gas price;
- native fee;
- decoded asset flows where supported.

## 9. Metrics

### 9.1 Raw metrics

- attributed transaction count;
- unique sending addresses;
- contracts touched;
- gas used;
- native fees paid;
- supported ERC-20 transfer value;
- first and last attributed activity.

### 9.2 Derived metrics

- daily and monthly active attributed addresses;
- new versus returning addresses;
- transaction retention cohorts;
- fee and volume by chain;
- attribution share for supported protocols;
- multi-L1 builder activity.

Derived metrics are estimates. The UI must display methodology and avoid equating gross transfer volume with value created.

## 10. API

Initial public endpoints:

```text
GET /v1/builders
GET /v1/builders/:code
GET /v1/builders/:code/metrics
GET /v1/builders/:code/transactions
GET /v1/chains
GET /v1/chains/:chainId/metrics
GET /v1/transactions/:hash/attribution
GET /v1/methodology
```

API requirements:

- cursor pagination;
- UTC timestamps;
- deterministic metric definitions;
- response schema versioning;
- basic rate limits;
- health and readiness endpoints;
- OpenAPI specification.

## 11. Dashboard

The public MVP contains:

- ecosystem overview;
- builder leaderboard;
- builder detail page;
- chain comparison;
- attributed transaction lookup;
- methodology and limitations;
- integration documentation link.

The leaderboard must support multiple ranking dimensions and must not present a single opaque composite score as objective truth.

## 12. Security and trust model

### 12.1 Registry

- Registry owns no user funds.
- Code ownership changes emit events.
- Administrative powers, if any, are minimal and documented.
- Registration constraints prevent unbounded storage writes.
- Contract tests cover duplicate registration, ownership transfer, revocation, and malformed metadata.

### 12.2 Attribution authenticity

A suffix proves that a transaction declared a code. It does not automatically prove that the registered builder created or authorized the transaction because builder codes are public.

The MVP reports this as **declared attribution**. Possible future assurance levels include:

- wallet-provider attestations;
- signatures from registered server wallets;
- protocol-enforced referrals;
- signed batched attribution claims;
- fraud reports and revocation policies.

These mechanisms must not be implied in the MVP application.

### 12.3 Privacy

- No offchain personal identity is required for ordinary users.
- Addresses are public chain data but should not be described as human identities.
- The dashboard avoids unnecessary address profiling.
- API documentation forbids claims that unique addresses equal unique people.

## 13. Testing

Required test layers:

- Foundry unit and fuzz tests for registry contracts;
- property tests for suffix encode/decode round trips;
- malformed suffix corpus;
- compatible and incompatible contract-call corpus;
- indexer idempotency and cursor recovery tests;
- API contract tests;
- dashboard smoke tests;
- Fuji end-to-end test from transaction creation to dashboard display.

Release gate:

- all automated tests pass;
- no high-severity secret scan findings;
- reproducible deployments;
- at least one external pilot successfully integrates without direct repository modification by the maintainer.

## 14. Operations

MVP infrastructure:

- containerized indexer and API;
- managed or self-hosted PostgreSQL;
- public read-only API;
- uptime and block-lag monitoring;
- structured logs without secrets;
- documented backup and replay procedure.

Target service objectives during the grant:

- API availability: 99% after public alpha;
- C-Chain indexing lag: under 60 seconds under normal conditions;
- no permanent transaction loss after worker restart;
- deterministic rebuild from a configured start block.

## 15. Delivery decisions

The MVP deliberately prioritizes a complete vertical slice over broad chain coverage. C-Chain plus one Avalanche L1 proves the multi-chain model. More L1s can be added after the ingestion and registry interfaces stabilize.

ICM is relevant to the applicant's experience and the project's future, but mandatory registry synchronization through ICM would add delivery risk without proving the core attribution demand. It is a post-MVP feature.
