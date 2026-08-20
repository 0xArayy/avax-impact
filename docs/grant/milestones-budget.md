# AVAX Impact Milestones and Budget

## Grant request

**Requested amount:** $10,000  
**Duration:** 8 weeks  
**Applicant commitment:** Full-time  
**Team:** Solo developer

## Milestone 1: Attribution foundation

**Schedule:** Weeks 1–2  
**Budget:** $2,500

### Deliverables

- Attribution format and compatibility specification.
- Builder-code validation rules.
- Solidity registry contract.
- Foundry unit and fuzz tests.
- Fuji deployment.
- Minimal TypeScript encoder and decoder.
- Demonstration transaction visible through a CLI decoder.

### Acceptance criteria

- A builder can register a code on Fuji.
- The SDK can append, detect, decode, and strip a valid suffix.
- Malformed and oversized suffixes fail safely.
- Registry ownership and update rules are covered by tests.
- Known incompatible calls are documented.

## Milestone 2: Developer SDK

**Schedule:** Weeks 3–4  
**Budget:** $2,000

### Deliverables

- Stable TypeScript API.
- Viem integration.
- Wagmi example application.
- ethers.js integration.
- `eth_call` compatibility check helper.
- Package documentation and runnable examples.

### Acceptance criteria

- A developer can integrate attribution in under 30 minutes using the guide.
- Examples run against Fuji.
- The SDK preserves the original transaction when compatibility checks fail.
- Encode/decode property tests pass across the supported input corpus.

## Milestone 3: Indexer and API

**Schedule:** Weeks 5–6  
**Budget:** $2,500

### Deliverables

- C-Chain ingestion worker.
- Ingestion for one selected Avalanche L1.
- PostgreSQL schema and migrations.
- Registry validation at ingestion time.
- Daily builder metrics pipeline.
- Versioned REST API and OpenAPI specification.
- Health, readiness, and block-lag monitoring.

### Acceptance criteria

- The pipeline is restart-safe and idempotent.
- The API returns attributed transactions and builder metrics from both supported chains.
- Reprocessing a block range does not double-count activity.
- Normal C-Chain indexing lag remains under 60 seconds during the public alpha.

## Milestone 4: Dashboard and adoption

**Schedule:** Weeks 7–8  
**Budget:** $3,000

### Deliverables

- Public ecosystem dashboard.
- Builder leaderboard and detail pages.
- Transaction attribution lookup.
- Methodology and limitations pages.
- Three pilot integrations.
- C-Chain mainnet registry deployment.
- Public launch report and next-step proposal.

### Acceptance criteria

- Three applications complete an integration.
- At least 10,000 testnet or mainnet transactions contain valid attribution.
- Dashboard and API are publicly accessible.
- Repository includes deployment and integration documentation.
- Final report distinguishes raw facts from derived economic estimates.

## Budget allocation

| Workstream | Amount | Share |
|---|---:|---:|
| Attribution specification and registry | $2,000 | 20% |
| SDK and wallet integrations | $2,000 | 20% |
| Indexer, database, and API | $2,500 | 25% |
| Dashboard | $1,500 | 15% |
| Pilot integrations and documentation | $1,000 | 10% |
| Testing, deployment, and security review | $1,000 | 10% |
| **Total** | **$10,000** | **100%** |

## Payment structure proposal

If Team1 supports milestone-based payments:

- 25% after Milestone 1;
- 20% after Milestone 2;
- 25% after Milestone 3;
- 30% after Milestone 4.

If Team1 uses a different payment schedule, the deliverables and acceptance criteria remain unchanged.

## Cost assumptions

- The applicant works full-time for eight weeks.
- Early infrastructure uses free or low-cost service tiers.
- The registry does not custody funds, reducing audit scope.
- The applicant performs implementation, testing, documentation, and pilot support.
- No grant funds are allocated to a token, liquidity, trading rewards, paid social engagement, or a new L1.

## Scope control

The following items are explicitly post-grant unless the core work finishes early:

- ICM registry synchronization;
- ERC-4337 coverage beyond the documented initial integration;
- permissionless reward distribution;
- more than two production chains;
- enterprise authentication and private dashboards;
- official GCP/GCI calculations;
- token incentives.
