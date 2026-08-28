# Changelog

This project follows semantic versioning after its first public release. Until 1.0,
minor releases may contain breaking API or contract changes that are called out here.

## 0.1.0 - 2026-08-28

### Added

- Confirmed-transaction analysis with receipt identity and successful execution checks.
- ERC-5792 `dataSuffix` capability helper for `wallet_sendCalls` integrations.
- Two-step builder-code ownership transfer.
- Security, contribution, governance, release, and GitHub maintenance processes.
- SDK coverage thresholds enforced by the normal test and CI gate.
- Live Fuji compatibility corpus with five external-contract probes and explicit
  evidence boundaries.
- Public schema 1 Fuji registry, compatible/strict demo contracts, confirmed attributed
  transaction, immutable source tag, deployment manifest, and automated verifier.
- Stable Vite/React static workbench deployed through Cloudflare Assets.
- Confirmed deployment-source provenance through annotated tag
  `fuji-schema0-v0.1.0` and automated tag-to-commit verification.
- Public discovery tracker, upstream-versioning policy, and a design-only signed
  attribution RFC.

### Changed

- Preflight pins a block, requires a successful original-call baseline, compares the
  original and attributed return data, and exposes typed failure stages. The default
  permits fallback only after an attributed-only recognized execution revert;
  baseline failures, return-data mismatches, and infrastructure failures block handoff.
- Schema 1 is the only default encode/preflight path and requires explicit registry
  address and chain ID. Schema 0 helpers moved to `@avax-impact/sdk/legacy` and explicit
  CLI commands.
- Removed the beta vinext/server-component runtime from the demo.
