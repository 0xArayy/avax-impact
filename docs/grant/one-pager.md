# AVAX Impact: Builder Attribution for Avalanche

## The problem

Avalanche can see which smart contract a transaction touches, but it cannot reliably see which frontend, wallet, bot, or backend automation generated it.

This attribution gap makes it difficult for builders to prove their impact and for ecosystem programs to identify which applications bring real users and economic activity. The problem becomes harder as activity spreads across C-Chain and sovereign Avalanche L1s.

## The product

AVAX Impact is an open attribution standard, registry, indexer, and dashboard for Avalanche.

Participating apps append a compact builder code to compatible EVM transactions. An onchain registry maps codes to verified builder metadata. A public indexer decodes attributed transactions and publishes metrics through an API and dashboard.

The result is an auditable answer to a question Avalanche cannot consistently answer today:

> Which application generated this transaction and what measurable value has that application brought to the ecosystem?

## Why now

Base launched Builder Codes and ERC-8021 in April 2026 to measure and reward the applications generating onchain activity.

Avalanche Foundation's July 2026 economic research agenda and August 2026 Gross Chain Income framework make measurement the first step toward sustainable value capture. Avalanche also has a stronger multi-chain attribution problem because applications operate across C-Chain and independent L1s.

The official Team1 Cascade catalog contains hundreds of Avalanche projects, but no visible builder-code or application-attribution standard.

## Eight-week MVP

- Publish the attribution and compatibility specification.
- Deploy the builder registry on Fuji and C-Chain.
- Ship TypeScript SDKs and wallet-stack examples.
- Index C-Chain and one Avalanche L1.
- Launch a public API and dashboard.
- Complete three pilot app integrations.
- Reach 10,000 valid attributed transactions.

## Why this applicant

0xArayy is a solo, full-time blockchain developer based in Armenia with more than four years of commercial Web3 experience.

The applicant designed and implemented backend validator and node components for CX Chain and worked with Avalanche ICM. This stack covers the full MVP: Solidity, Foundry, Hardhat, ethers.js, web3.js, Node.js, NestJS, Go, React, and Next.js.

## Grant request

**Amount:** $10,000  
**Duration:** 8 weeks  
**License:** MIT  
**Token:** None  
**Repository:** Public

The grant funds contracts, SDKs, indexing, dashboard development, three pilot integrations, tests, and documentation.

## Long-term path

The core attribution layer remains free and open source. Sustainability can come from optional hosted analytics, custom L1 integrations, historical exports, and enterprise reporting.

Later versions may add ICM registry synchronization, wallet-native attribution, ecosystem rewards, and grant impact reporting. These features are not required for the mini-grant MVP.
