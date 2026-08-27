# Registry and project governance

## Status

The local `BuilderRegistry` is an unaudited candidate implementing the pinned
`ICodeRegistry` read surface. It is not an Avalanche, Ava Labs, Foundation, or Team1
canonical registry. The historical Fuji address is a legacy prototype with a different
ABI.

## Code-name policy

Registration is permissionless and first-come. That does not prove a relationship
between a code, domain, company, or transaction creator. Name disputes and squatting
cannot be solved by the current contract. Consumers must display registry address,
chain, record status, and “declared attribution” language rather than a verified badge.

Ownership transfer is two-step: the owner proposes a destination and the destination
accepts. Deactivation is permanent and clears any pending transfer. A future deployment
must publish bytecode/source verification, governance keys if any, and a migration path;
it must not silently replace a registry address in SDK defaults.

## Change process

Wire-format, resolver ABI, lifecycle, and deployment changes require a public issue,
tests, a changelog entry, maintainer review, and a versioned release. Draft ERC changes
are evaluated as new versions; the pinned draft is not retroactively reinterpreted.

## Maintainers and bus factor

The repository currently has one public maintainer, GitHub user
[`@0xArayy`](https://github.com/0xArayy). This is a material bus-factor risk. A second
maintainer should be added only after reviewed contributions and explicit agreement;
release and deployment authority must then be documented here. No larger team is
claimed.

## Sustainability

The core SDK, fixtures, registry candidate, and verifier remain MIT-licensed. Grant
funding is proposed for validation and defined deliverables, not permanent hosting.
After the grant, maintenance is limited to security fixes, draft-version migrations
supported by demand, and community-reviewed integrations. A hosted index/API proceeds
only if pilots identify a downstream user and an operating sponsor; reproducible local
exports remain the no-hosting fallback.
