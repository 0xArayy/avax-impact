# ERC-8021 upstream and versioning risk

AVAX Impact currently pins proposal commit
[`457532f5c064a4619868ee5e4950f0cc32a7917e`](https://github.com/ilikesymmetry/ERCs/blob/457532f5c064a4619868ee5e4950f0cc32a7917e/ERCS/erc-8021.md).
That commit is an input to local conformance tests, not evidence of a finalized standard,
Avalanche endorsement, or a durable upstream release.

As reviewed on 2026-08-28, the upstream proposal was still under review. Therefore:

- artifacts, fixtures, manifests, and release notes must carry the full pinned commit;
- schema 1 behavior is never described as final or canonical;
- an upstream change is evaluated as a new compatibility version, with new vectors and
  explicit migration notes;
- ambiguous decoding between revisions is a stop condition;
- no new Fuji schema 1 deployment is promoted before the pin is retrievable from a
  durable repository reference and the migration decision is published.

The project should monitor the upstream proposal before every release. A changed draft
does not retroactively alter already-published AVAX Impact payloads.
