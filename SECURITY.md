# Security policy

AVAX Impact handles public transaction metadata and does not custody keys or funds, but
bugs in calldata preparation, parsing, registry lifecycle, or RPC validation can still
cause unsafe transaction handoffs.

## Supported versions

Only the latest commit on `main` and the latest published release are supported. The
project is pre-1.0 and unaudited; APIs and contracts may change between minor releases.

## Reporting a vulnerability

Do not publish an exploitable report in a GitHub issue. Use the repository's
[private vulnerability report](https://github.com/0xArayy/avax-impact/security/advisories/new).
If private reporting is unavailable, open an issue containing no sensitive details and
ask the maintainer for a private channel.

Include affected versions or commits, impact, reproduction steps, and a suggested fix
when available. The maintainer will acknowledge a report within five business days,
triage severity, and coordinate disclosure after a fix. No bounty is promised.

## Explicit trust boundaries

- Builder codes are public, copyable declarations—not authentication or proof of origin.
- Never use a decoded code alone for authorization, payments, rewards, or grant scoring.
- Matching original/attributed `eth_call` return data at one pinned block is
  point-in-time compatibility evidence, not proof of equal state effects or an
  execution guarantee.
- RPC transport, timeout, HTTP, or malformed-response failures are inconclusive. The SDK
  blocks calldata selection by default for those failures.
- Contracts and SDK have not received an independent audit.
