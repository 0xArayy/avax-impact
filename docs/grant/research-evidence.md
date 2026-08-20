# Research and Evidence

Research snapshot: 20 August 2026.

## Grant program

Team1 Mini Grants accepts applications from new and established projects, community builders, developers, and teams with unique ideas. The published maximum is $10,000.

- Team1 grants: https://www.team1.network/grants
- Avalanche Builder Hub grants: https://build.avax.network/grants

## Avalanche economic priorities

Avalanche Foundation's July 2026 economic research agenda organizes its work around measuring ecosystem value, capturing part of that value at the protocol level, and distributing captured value to support AVAX and network security.

- Economic research agenda: https://www.avax.network/about/blog/the-avalanche-foundation-unveils-its-economic-research-agenda

The August 2026 Gross Chain Income publication states that measurement must precede mechanism design. For June 2026 it estimated:

- $3.1 million nominal GCP;
- $5.8 million nominal GCI;
- $12.7 million nominal GCI-general;
- C-Chain fee burn near 3% of monthly nominal GCP.

The article identifies application and L1 revenue sharing as an active research area.

- Gross Chain Income: https://www.avax.network/about/blog/from-gross-chain-product-to-gross-chain-income-where-the-value-goes

## Multi-L1 architecture

Avalanche L1s can define independent execution rules, gas tokens, fee regimes, validator sets, privacy controls, and compliance requirements while communicating through Avalanche Warp Messaging.

- Avalanche L1 documentation: https://build.avax.network/docs/avalanche-l1s

The official Team1 Cascade catalog listed 672 projects and 29 categories during the research snapshot. A local analysis of the catalog found 65 projects carrying an L1 label.

- Team1 Cascade ecosystem map: https://cascade.team1.network/ecosystem

This supports the need for a shared application identity and attribution layer across independent chains.

## External validation: Base Builder Codes

Base launched Builder Codes and ERC-8021 in April 2026. The system lets applications append a standardized code to transactions so their activity can be measured and potentially rewarded.

Base explicitly describes the attribution gap between onchain protocols and offchain apps such as frontends, bots, wallets, and backend automations.

- Base Builder Codes and ERC-8021: https://blog.base.dev/builder-codes-and-erc-8021-fixing-onchain-attribution

AVAX Impact reuses this validated EVM pattern while addressing Avalanche-specific requirements:

- C-Chain and sovereign L1 coverage;
- chain-specific gas and fee models;
- ecosystem-wide builder identity;
- grant and economic-impact reporting;
- future ICM synchronization.

## Market saturation and gap analysis

The Team1 Cascade export contained:

- 51 projects with an AI label;
- 41 with a Payments label;
- 37 with a Stablecoin label;
- 33 projects in the DEX category;
- 21 bridges;
- 16 wallets;
- 11 prediction-market projects;
- 5 x402 projects.

Searches across titles, descriptions, and labels found no explicit project centered on:

- builder codes;
- application-level transaction attribution;
- attribution-aware GCP/GCI measurement;
- transaction-credit standards for ecosystem grants.

This is evidence of a public catalog gap, not proof that no private or unlisted team is working on the problem. Before submission, the applicant should ask Team1 and two ecosystem analytics teams whether an overlapping project exists.

## Broader ecosystem signals

Avalanche's 2026 positioning emphasizes payments, stablecoins, RWA, institutional settlement, gaming, enterprise applications, and sovereign L1s.

- Avalanche Payments Collective: https://www.avax.network/about/blog/avalanche-payments-collective
- Avalanche RWA metrics: https://app.rwa.xyz/networks/avalanche
- Avalanche gaming: https://www.avax.network/gaming

The project is horizontal infrastructure. It can measure app contribution across all these verticals without competing for liquidity or launching a separate ecosystem.

## Naming check

The initial working name was Snowprint. A GitHub search found an existing repository using that name for an Avalanche network explorer. Its published feature set covers network statistics, blocks, transactions, cross-chain activity, governance proposals, and network-health indicators. It does not describe a builder-code registry, calldata attribution standard, application SDK, or builder-level multi-L1 analytics.

This is a naming collision, not evidence that the AVAX Impact product has already been implemented. The grant package uses **AVAX Impact** to avoid brand confusion with the unrelated explorer.

This is only a preliminary collision check. Trademark, domain, social-handle, package-registry, and corporate-name availability still require verification before a public launch.
